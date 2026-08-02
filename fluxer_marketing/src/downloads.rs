// SPDX-License-Identifier: AGPL-3.0-or-later

use crate::i18n::Locale;
use moka::future::Cache;
use serde::Deserialize;
use std::collections::BTreeMap;
use std::time::Duration;
use time::{OffsetDateTime, format_description::well_known::Rfc3339};

const FETCH_TIMEOUT: Duration = Duration::from_millis(1500);
const CACHE_TTL: Duration = Duration::from_secs(120);

#[derive(Clone, Debug, Default)]
pub struct LatestDesktopVersions {
    pub windows: Option<LatestVersionInfo>,
    pub macos: Option<LatestVersionInfo>,
    pub linux: Option<LatestVersionInfo>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct LatestVersionInfo {
    pub version: String,
    #[serde(default)]
    pub pub_date: Option<String>,
    #[serde(default)]
    pub minimum_system_version: Option<String>,
    #[serde(default)]
    pub files: BTreeMap<String, LatestVersionFile>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct LatestVersionFile {
    #[serde(default)]
    pub sha256: Option<String>,
    #[serde(default)]
    pub checksum_url: Option<String>,
}

#[derive(Clone, Debug, Default)]
pub struct InstanceClientDownloadsConfig {
    pub desktop_update_feed_url: Option<String>,
    pub desktop_download_url: Option<String>,
    pub mobile_ios_url: Option<String>,
    pub mobile_android_url: Option<String>,
}

#[derive(Clone)]
pub struct LatestVersionsCache {
    entries: Cache<String, LatestDesktopVersions>,
    client_downloads: Cache<(), InstanceClientDownloadsConfig>,
}

impl LatestVersionsCache {
    pub fn new() -> Self {
        Self {
            entries: Cache::builder()
                .max_capacity(8)
                .time_to_live(CACHE_TTL)
                .build(),
            client_downloads: Cache::builder()
                .max_capacity(1)
                .time_to_live(CACHE_TTL)
                .build(),
        }
    }
}

impl Default for LatestVersionsCache {
    fn default() -> Self {
        Self::new()
    }
}

pub async fn fetch_client_downloads_cached(
    cache: &LatestVersionsCache,
    client: &reqwest::Client,
    api_endpoint: &str,
) -> InstanceClientDownloadsConfig {
    if let Some(cached) = cache.client_downloads.get(&()).await {
        return cached;
    }
    let fresh = fetch_client_downloads(client, api_endpoint).await;
    cache.client_downloads.insert((), fresh.clone()).await;
    fresh
}

pub async fn fetch_client_downloads(
    client: &reqwest::Client,
    api_endpoint: &str,
) -> InstanceClientDownloadsConfig {
    let url = format!(
        "{}/.well-known/fluxer",
        api_endpoint.trim_end_matches('/')
    );
    let response = match client
        .get(url)
        .timeout(FETCH_TIMEOUT)
        .header(reqwest::header::ACCEPT, "application/json")
        .send()
        .await
    {
        Ok(response) => response,
        Err(_) => return InstanceClientDownloadsConfig::default(),
    };
    if !response.status().is_success() {
        return InstanceClientDownloadsConfig::default();
    }
    let body = match response.bytes().await {
        Ok(body) => body,
        Err(_) => return InstanceClientDownloadsConfig::default(),
    };
    if body.is_empty() {
        return InstanceClientDownloadsConfig::default();
    }
    let payload: serde_json::Value = match serde_json::from_slice(&body) {
        Ok(payload) => payload,
        Err(_) => return InstanceClientDownloadsConfig::default(),
    };
    let downloads = payload.get("app_public").and_then(|value| value.get("downloads"));
    let Some(downloads) = downloads else {
        return InstanceClientDownloadsConfig::default();
    };
    let get_string = |key: &str| -> Option<String> {
        downloads
            .get(key)
            .and_then(serde_json::Value::as_str)
            .filter(|value| !value.trim().is_empty())
            .map(|value| value.trim().to_owned())
    };
    InstanceClientDownloadsConfig {
        desktop_update_feed_url: get_string("desktop_update_feed_url"),
        desktop_download_url: get_string("desktop_download_url"),
        mobile_ios_url: get_string("mobile_ios_url"),
        mobile_android_url: get_string("mobile_android_url"),
    }
}

pub async fn fetch_latest_desktop_versions_cached(
    cache: &LatestVersionsCache,
    client: &reqwest::Client,
    api_endpoint: &str,
    channel: &str,
) -> LatestDesktopVersions {
    if let Some(cached) = cache.entries.get(channel).await {
        return cached;
    }
    let fresh = fetch_latest_desktop_versions(client, api_endpoint, channel).await;
    if fresh.windows.is_some() || fresh.macos.is_some() || fresh.linux.is_some() {
        cache
            .entries
            .insert(channel.to_owned(), fresh.clone())
            .await;
    }
    fresh
}

pub async fn fetch_latest_desktop_versions(
    client: &reqwest::Client,
    api_endpoint: &str,
    channel: &str,
) -> LatestDesktopVersions {
    let windows = fetch_latest_desktop_version(client, api_endpoint, channel, "win32", "x64");
    let macos = fetch_latest_desktop_version(client, api_endpoint, channel, "darwin", "arm64");
    let linux = fetch_latest_desktop_version(client, api_endpoint, channel, "linux", "x64");
    let (windows, macos, linux) = tokio::join!(windows, macos, linux);
    LatestDesktopVersions {
        windows,
        macos,
        linux,
    }
}

pub fn format_latest_version_line(_locale: Locale, info: &LatestVersionInfo) -> String {
    let date = info
        .pub_date
        .as_deref()
        .and_then(|value| OffsetDateTime::parse(value, &Rfc3339).ok())
        .and_then(|value| {
            value
                .format(&time::macros::format_description!("[year]-[month]-[day]"))
                .ok()
        });
    match date {
        Some(date) => format!("v{} • {date}", info.version),
        None => format!("v{}", info.version),
    }
}

async fn fetch_latest_desktop_version(
    client: &reqwest::Client,
    api_endpoint: &str,
    channel: &str,
    platform: &str,
    arch: &str,
) -> Option<LatestVersionInfo> {
    let url = format!(
        "{}/dl/desktop/{channel}/{platform}/{arch}/latest",
        api_endpoint.trim_end_matches('/')
    );
    let response = client
        .get(url)
        .timeout(FETCH_TIMEOUT)
        .header(reqwest::header::ACCEPT, "application/json")
        .send()
        .await
        .ok()?;
    if !response.status().is_success() {
        return None;
    }
    let body = response.bytes().await.ok()?;
    if body.is_empty() {
        return None;
    }
    let info = serde_json::from_slice::<LatestVersionInfo>(&body).ok()?;
    if info.version.is_empty() {
        None
    } else {
        Some(info)
    }
}
