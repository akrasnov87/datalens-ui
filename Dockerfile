ARG UBUNTU_VERSION=24.04

# use native build platform for build js files only once
FROM --platform=${BUILDPLATFORM} ubuntu:${UBUNTU_VERSION} AS native-build-stage

ARG BUILDARCH
ARG NODE_MAJOR=22
ARG PNPM_VERSION=10.17.1

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get -y upgrade && apt-get -y install ca-certificates curl gnupg

# node
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get -y install nodejs g++ make wget

RUN npm install -g pnpm@${PNPM_VERSION}

RUN useradd -m -u 1001 app && mkdir /opt/app && chown app:app /opt/app

WORKDIR /opt/app

COPY highcharts-load.sh fonts-load.sh package.json pnpm-lock.yaml .npmrc /opt/app/
RUN --mount=type=cache,id=pnpm-store-${BUILDARCH},target=/pnpm_store \
    pnpm config set store-dir=/pnpm_store --location=project && \
    pnpm config set cache-dir=/pnpm_cache --location=project && \
    pnpm config delete virtual-store-dir --location=project && \
    pnpm install --frozen-lockfile --prefer-offline

COPY patches/ /opt/app/patches/
# нужен для выполнения postinstall (express-openid-connect)
RUN chmod 775 /opt/app/highcharts-load.sh
RUN chmod 775 /opt/app/fonts-load.sh

COPY ./dist /opt/app/dist
COPY ./src /opt/app/src

RUN /opt/app/highcharts-load.sh
RUN /opt/app/fonts-load.sh

COPY app-builder.config.ts tsconfig.json /opt/app/

RUN npx patch-package
RUN pnpm run build && chown app /opt/app/dist/run

# runtime base image for both platform
FROM ubuntu:${UBUNTU_VERSION} AS base-stage

ARG NODE_MAJOR=22
ARG PNPM_VERSION=10.17.1

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get -y upgrade && apt-get -y install ca-certificates curl gnupg && \
    apt-get -y install python3 python3-pip python3-venv
    
# node
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get -y install nginx supervisor nodejs

RUN npm install -g pnpm@${PNPM_VERSION}

# remove unnecessary packages
RUN apt-get -y purge curl gnupg gnupg2 && \
    apt-get -y autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /etc/apt/sources.list.d/nodesource.list && \
    rm -rf /etc/apt/keyrings/nodesource.gpg

# timezone setting
ENV TZ="Etc/UTC"
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# user app
RUN useradd -m -u 1001 app && mkdir /opt/app && chown app:app /opt/app

# install package dependencies for production
FROM base-stage AS install-stage

ARG TARGETARCH

# install system dependencies
RUN apt-get update && apt-get -y install g++ make

WORKDIR /opt/app

COPY package.json pnpm-lock.yaml .npmrc /opt/app/
COPY patches/ /opt/app/patches/

RUN --mount=type=cache,id=pnpm-store-${TARGETARCH},target=/pnpm_store \
    pnpm config set store-dir=/pnpm_store --location=project && \
    pnpm config set cache-dir=/pnpm_cache --location=project && \
    pnpm config delete virtual-store-dir --location=project && \
    pnpm install --frozen-lockfile --prefer-offline --prod

# production running stage
FROM base-stage AS runtime-stage

COPY deploy/nginx /etc/nginx
COPY deploy/supervisor/supervisord.conf /etc/supervisor/supervisord.conf

# ставим библиотеки python в виртуальное окружение
COPY export/requirements.txt /opt/app/export/requirements.txt

# Создаем виртуальное окружение и устанавливаем зависимости
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --timeout 120 --retries 5 \
    --index-url https://mirrors.cloud.tencent.com/pypi/simple \
    --extra-index-url https://pypi.org/simple \
    -r /opt/app/export/requirements.txt

# Добавляем виртуальное окружение в PATH
ENV PATH="/opt/venv/bin:$PATH"

# prepare rootless permissions for supervisor and nginx
ARG USER=app
RUN chown -R ${USER} /etc/nginx && \
    chown -R ${USER} /etc/supervisor && \
    rm -rf  /etc/supervisor/conf.d && \
    rm -rf  /etc/nginx/sites-available && \
    rm -rf  /etc/nginx/sites-enabled && \
    rm -rf  /etc/nginx/nginx-default.conf

ARG app_version
ENV APP_VERSION=$app_version
ENV TMPDIR=/tmp

WORKDIR /opt/app

COPY export/dash2sheets.py /opt/app/export/dash2sheets.py
COPY export/csv2ods.py /opt/app/export/csv2ods.py

# Убеждаемся, что Python скрипты используют правильный интерпретатор
RUN sed -i '1s|^#!/usr/bin/env python3|#!/opt/venv/bin/python3|' /opt/app/export/dash2sheets.py && \
    sed -i '1s|^#!/usr/bin/env python3|#!/opt/venv/bin/python3|' /opt/app/export/csv2ods.py

COPY --from=install-stage /opt/app/package.json /opt/app/pnpm-lock.yaml /opt/app/
COPY --from=install-stage /opt/app/node_modules /opt/app/node_modules
COPY --from=native-build-stage /opt/app/dist /opt/app/dist

# Running Puppeteer (https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker)
RUN apt-get update \
    && apt-get install -y wget \
    && apt-get install -y fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && dpkg -i google-chrome-stable_current_amd64.deb || apt-get install -fy \
    && rm google-chrome-stable_current_amd64.deb \
    && rm -rf /var/lib/apt/lists/*

# Переустановка puppeteer через npm с правильной PUPPETEER_CACHE_DIR
# RUN PUPPETEER_CACHE_DIR=$(pwd) \
#     npm install --no-save --legacy-peer-deps --force puppeteer@23.11.1


RUN mkdir /opt/app/table-report-headers
RUN chown -R ${USER} /opt/app/table-report-headers

RUN chown -R ${USER} /opt/app/dist/run
RUN chown -R ${USER} /opt/app/export 

USER app

ENV NODE_ENV=production

ENV APP_BUILDER_CDN=false
ENV UI_CORE_CDN=false

ENV APP_MODE=full
ENV APP_ENV=production
ENV APP_INSTALLATION=opensource
ENV APP_PORT=3030

EXPOSE 8080

ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]