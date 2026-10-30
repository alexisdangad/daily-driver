# Sources de veille (liste de l'utilisateur, 30/10/2026)
À parcourir à chaque cycle (WebSearch avec « site: » ou requêtes ciblées ; WebFetch sur les pages d'article).

## Actualité générale, essais, nouveautés
caradisiac.com · largus.fr · automobile-magazine.fr · auto-moto.com · autoplus.fr · fr.motor1.com · moniteurautomobile.be · turbo.fr · autocar.co.uk · caranddriver.com

## Sport auto (F1, WEC, rallye, GT)
autohebdo.fr · fr.motorsport.com · sportauto.fr · endurance-info.com · motorsport.nextgen-auto.com · racefans.net · racer.com

## Culture, lifestyle, design, supercars
speedhunters.com · petrolicious.com · topgear.com · topgear-magazine.fr · carfans.fr · automobile-sportive.com · evo.co.uk · roadandtrack.com · motorlegend.com · stanceworks.com

## Événements, rassemblements, historiques, enchères
newsdanciennes.com · rasso.app · ffsa.org (calendrier) · goodwood.com/grr · peterauto.fr · classicdriver.com · bringatrailer.com · leshardis.com

## Ajout 30/10 (demande utilisateur)
https://www.autoscout24.fr/informer/actualite/ (page d’actualité AutoScout24 France : la parcourir à chaque cycle)

## Règle de crédit des sources (30/10)
Dans la légende, chaque source cite : « Média, titre exact de l’article, par Prénom Nom (date) ». Le nom du rédacteur est TOUJOURS indiqué quand il figure sur l’article (le chercher dans la page ; s’il n’est vraiment pas indiqué, mettre « rédaction »).

## Événements (ajout 30/10) : « Auditoire » (à confirmer), Driving Evolution, et événements similaires

## Précisions événementiel (30/10)
Auditoire (agence événementielle : relaie les événements organisés pour des marques auto) · Driving Evolution : à suivre pour les posts « événements / coulisses ».

## Astuce technique
Le cron GitHub (*/15) est irrégulier (~1 h). Pour publier tout de suite : `curl -s -X POST -H "Accept: application/vnd.github+json" -H "Content-Type: application/json" https://api.github.com/repos/alexisdangad/daily-driver/actions/workflows/publish.yml/dispatches -d '{"ref":"main"}'` (204 = OK). Même chose avec render.yml pour re-générer les visuels.
