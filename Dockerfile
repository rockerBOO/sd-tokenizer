FROM pierrezemb/gostatic
COPY worker.js /srv/http/worker.js
COPY main.js /srv/http/main.js
COPY main.css /srv/http/main.css
COPY reset.css /srv/http/reset.css
COPY favicon-32.ico /srv/http/favicon-32.ico
COPY favicon-32.png /srv/http/favicon-32.png
COPY apple-favicon.png /srv/http/apple-favicon.png
COPY index.html /srv/http/index.html
COPY pkg /srv/http/pkg
CMD ["-port","8080","-https-promote", "-enable-logging"]
