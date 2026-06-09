FROM alpine:3 AS inject
COPY dist /srv/http
ARG CF_BEACON_TOKEN
RUN if [ -n "$CF_BEACON_TOKEN" ]; then \
    sed -i "s|</body>|<!-- Cloudflare Web Analytics --><script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{\"token\": \"$CF_BEACON_TOKEN\"}'></script><!-- End Cloudflare Web Analytics -->\n</body>|" /srv/http/index.html; \
fi

FROM pierrezemb/gostatic
COPY --from=inject /srv/http /srv/http
CMD ["-port","8080","-https-promote", "-enable-logging"]
