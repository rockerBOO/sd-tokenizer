FROM pierrezemb/gostatic
COPY worker.js /srv/http/worker.js
COPY main.js /srv/http/main.js
COPY main.css /srv/http/main.css
COPY index.html /srv/http/index.html
COPY pkg /srv/http/pkg
CMD ["-port","8080","-https-promote", "-enable-logging"]
