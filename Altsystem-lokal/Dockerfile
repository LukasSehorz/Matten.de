# PHP 7.0 mit Apache — die Laufzeit, fuer die MeltingShop gebaut ist.
# Bewusst alt: der Shop laeuft nicht auf PHP 8, weil er an 434 Stellen die
# alten mysql_*-Funktionen nutzt (nur ueber einen Shim lauffaehig).
FROM php:7.0-apache

# Debian Stretch ist abgekuendigt — die Paketquellen liegen im Archiv.
RUN set -eux; \
    sed -i -e 's|deb.debian.org|archive.debian.org|g' \
           -e 's|security.debian.org|archive.debian.org|g' \
           -e '/stretch-updates/d' /etc/apt/sources.list; \
    printf 'Acquire::Check-Valid-Until "false";\n' > /etc/apt/apt.conf.d/99no-check-valid-until

# Erweiterungen, die der Shop braucht: Bilder (gd), Umlaute (mbstring),
# XSL fuer die PDF-Belege, Internationalisierung, ZIP, mysqli.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        libpng-dev libjpeg-dev libfreetype6-dev \
        libxml2-dev libxslt1-dev libicu-dev zlib1g-dev \
        default-mysql-client; \
    docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/; \
    docker-php-ext-install -j"$(nproc)" gd mysqli mbstring xsl intl opcache; \
    apt-get clean; rm -rf /var/lib/apt/lists/*

# Apache: Rewrite (die .htaccess des Shops leitet alles auf index.php),
# Headers, und .htaccess ueberhaupt zulassen.
RUN set -eux; \
    a2enmod rewrite headers; \
    printf '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n' > /etc/apache2/conf-available/shop.conf; \
    a2enconf shop

# PHP-Einstellungen wie in der Entwicklungsumgebung des Herstellers
# (build/vagrant/bootstrap.d/20-apache-php): short_open_tag ist PFLICHT,
# die Templates verwenden durchgaengig die kurze Echo-Schreibweise.
RUN { \
      echo 'short_open_tag = 1'; \
      echo 'memory_limit = 512M'; \
      echo 'upload_max_filesize = 64M'; \
      echo 'post_max_size = 64M'; \
      echo 'max_execution_time = 120'; \
      echo 'date.timezone = Europe/Berlin'; \
      echo 'display_errors = Off'; \
      echo 'log_errors = On'; \
      echo 'error_log = /dev/stderr'; \
    } > /usr/local/etc/php/conf.d/shop.ini

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
