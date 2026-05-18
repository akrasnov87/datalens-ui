version=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{gsub(/"/,"",$2);gsub(/[[:space:]]*/,"",$2); print $2}' \
  | sed 's/[",]//g')
echo $version

docker build -t akrasnov87/datalens-ui:$version .