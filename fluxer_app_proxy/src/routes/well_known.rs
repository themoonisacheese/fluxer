// SPDX-License-Identifier: AGPL-3.0-or-later

use crate::state::AppState;
use axum::{
	extract::State,
	http::{HeaderValue, StatusCode, header},
	response::{IntoResponse, Response},
};

pub async fn fluxer_well_known(State(state): State<AppState>) -> Response {
	match state.discovery_cache.get().await {
		Some(discovery) => match serde_json::to_vec(&discovery.data) {
			Ok(body) => {
				let mut response = Response::new(axum::body::Body::from(body));
				response.headers_mut().insert(
					header::CONTENT_TYPE,
					HeaderValue::from_static("application/json"),
				);
				response.headers_mut().insert(
					header::CACHE_CONTROL,
					HeaderValue::from_static("public, max-age=60"),
				);
				response
			}
			Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
		},
		None => StatusCode::SERVICE_UNAVAILABLE.into_response(),
	}
}
