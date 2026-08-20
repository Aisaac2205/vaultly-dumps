#!/bin/sh
set -eu

# Only directive names are accepted: this value is substituted into an nginx
# add_header directive, so arbitrary input would be configuration injection.
CSP_HEADER_NAME="${CSP_HEADER_NAME:-Content-Security-Policy-Report-Only}"
case "$CSP_HEADER_NAME" in
  Content-Security-Policy|Content-Security-Policy-Report-Only)
    export CSP_HEADER_NAME
    ;;
  *)
    echo >&2 "CSP_HEADER_NAME must be Content-Security-Policy or Content-Security-Policy-Report-Only"
    exit 1
    ;;
esac

# Railway's public edge overwrites X-Real-IP with the remote client's address.
# Trust it only when Railway's server-side environment marker is present and
# nginx is reached exclusively through that edge. Outside Railway, use the TCP
# peer address and ignore all client-supplied forwarding headers.
client_ip_mode="${CLIENT_IP_MODE:-auto}"
if [ "$client_ip_mode" = "auto" ]; then
  if [ -n "${RAILWAY_ENVIRONMENT_ID:-}" ]; then
    client_ip_mode="railway"
  else
    client_ip_mode="direct"
  fi
fi

case "$client_ip_mode" in
  railway)
    if [ -z "${RAILWAY_ENVIRONMENT_ID:-}" ]; then
      echo >&2 "CLIENT_IP_MODE=railway requires RAILWAY_ENVIRONMENT_ID"
      exit 1
    fi
    # Keep nginx's request-time variable literal.
    # shellcheck disable=SC2016
    CLIENT_IP_SOURCE='$http_x_real_ip'
    ;;
  direct)
    # Keep nginx's request-time variable literal.
    # shellcheck disable=SC2016
    CLIENT_IP_SOURCE='$remote_addr'
    ;;
  *)
    echo >&2 "CLIENT_IP_MODE must be auto, railway, or direct"
    exit 1
    ;;
esac

export CLIENT_IP_SOURCE
