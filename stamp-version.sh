#!/bin/sh

# stamp current git version into application
SRCVERSION=`git log --pretty=format:'%h' -1`
SRCTOOLTIP=`git log --pretty=format:'%h %ad %s' -1 --date=iso`
echo ">>> stamping $SRCTOOLTIP"
sed -i "s~@srcVersion~$SRCVERSION~" src/app/shared/info.service.ts
sed -i "s~@srcTooltip~$SRCTOOLTIP~" src/app/shared/info.service.ts
