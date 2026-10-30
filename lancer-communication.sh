#!/bin/sh
# ------------------------------------------------------------
#  Ouidrop - ouvre la page de communication en plein ecran (Linux / Odroid)
#  Modifier uniquement la ligne URL ci-dessous.
# ------------------------------------------------------------
URL="https://mmw-ouidrop.github.io/com-bornes/index.html"

# Utile si le script est lance depuis une session SSH plutot que depuis le bureau
export DISPLAY="${DISPLAY:-:0}"

# Profil separe : garantit que le mode plein ecran s'applique meme si Firefox est deja ouvert
PROFIL="$HOME/.ouidrop-kiosk"
mkdir -p "$PROFIL"

exec firefox --no-remote --profile "$PROFIL" --kiosk "$URL"
