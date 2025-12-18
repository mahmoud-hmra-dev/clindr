@echo off
wsl -d Ubuntu-22.04 -u root -- bash -lc "service docker start; cd /home/mahmoud/projects/clindr && docker compose up -d; tail -f /dev/null"
