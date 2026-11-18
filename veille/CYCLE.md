VEILLE HORAIRE (Alexis 13/11) : pas de plafond de posts. Veille toutes les heures de 8h à 23h (rappel send_later chaîné chaque heure). Toute actu chaude vérifiée (≥2 sources) est publiée dans l'heure, au premier créneau libre à ≥40 min du post précédent. Les créneaux 12-13h et 18-21h restent prioritaires pour les plus gros sujets.

AUTONOMIE TOTALE (Alexis 05/11) : ne jamais demander de validation des sujets ; choisir, produire et publier seul. Objectifs : être le média auto le plus réactif et viral (actu chaude dans les heures, 3 à 6 posts/jour + 1 Reel/jour, créneaux 12-13h et 18-21h prioritaires). Informer Alexis seulement du résultat, en une ligne.

# Cycle Daily Driver (instructions complètes, lues à chaque cycle)

Économie (demande d'Alexis 02/11) : cycles toutes les 2 h de 08:00 à 23:00 (Paris), pas de cycle la nuit. Lire seulement ce fichier + les sections utiles de sources-media.md (pas tout à chaque fois). Recherches web ciblées (3–5 requêtes max par cycle), pas de relecture de fichiers déjà connus, réponses d'1 ligne.

1. git pull des 2 dépôts. Publication ACTIVE et AUTONOME (pas de PAUSE). Cadence mini 40 min.
2. Erreurs « limit reached » / média pas prêt : présumé en ligne, jamais d'alerte à Alexis ; ne lui écrire que si le script plante complètement.
3. Veille OBLIGATOIRE À CHAQUE CYCLE (correctif 03/11) : les sites (Auto Plus, L'argus, Turbo.fr, Motorlegend, L'Automobile Magazine, Clubic, Journal de l'Automobile…) NE SONT PAS ouvrables en direct (WebFetch refuse les pages d'accueil) : faire 6 à 8 WebSearch ciblées (« <sujet> » + noms de sites, 'extended' si maigre), puis WebFetch sur les articles remontés. Lister les sujets < 24 h (nouveautés, chiffres, leaks, prix, Porsche/Ferrari/F1, collabs, actu pratique : carburants, assurance, cyber, marché) ; en publier 2 à 4 par jour, étalés (≥ 40 min). Ne jamais conclure « rien de fort » sans ce balayage. Chaîne : sources.json (3-4 pages d'articles, jamais de photos de personnes) → push → attendre render.yml → lire candidates/contact.jpg → post.json (photo = propos exact) → push → attendre rendu → vérifier montage → `python3 /home/claude/prep.py <slug> <publish_at>` (ne touche plus aux slides) → push media + dépôt. Pour relancer les candidats : supprimer posts/<slug>/candidates et pousser. Supprimer les slide-N.png obsolètes. Ancien libellé : collabs luxe × auto, actu F1 (résultats de séances publiés dès qu'ils tombent), 8 piliers (sources-media.md). 1 à 2 carrousels/jour max, sujets forts uniquement.
4. Reel : 1/jour max, autonome si pertinent ; au 1er cycle après 09:00, si rien n'est programmé : skill daily-driver-reel (base v4, outro logo + Abonne-toi + réseaux), programmé 18:30 semaine / 12:30 week-end via render/reel/prep_reel.py + rappel de dispatch unique ; vidéo envoyée à Alexis pour info. Sujet faible = on saute.
5. 1×/jour : el-usage.yml, alerter si quota ElevenLabs > 80 %.
6. Règles de contenu : sources-media.md (légendes sans @ ni « Avec », sources avec rédacteur, 3–5 hashtags, mot-clé < 125 car., question finale, jamais « drop »). Photos de personnes : seulement assets/drivers (fournies par Alexis). Post copié : retirer les clés ig_*.
7. Fin : reprogrammer le cycle suivant avec send_later (+120 min ; si l'heure dépasse 23:00, programmer 08:07 Paris le lendemain), message identique : « Cycle Daily Driver : lire veille/CYCLE.md et l'appliquer. »


## CHECKLIST VEILLE OBLIGATOIRE (ajout 12/11 après sujets ratés : plaques perso, PSG x Bentley, académie Russell)
À chaque veille, en plus des sites supercar, faire ces recherches ciblées (WebSearch, dernières 24 h) :
1. France pratique / réglementation : "automobilistes", "plaque immatriculation", "permis", "radar", "Sénat loi voiture", "carte grise".
2. Sport x auto / collabs : "partenariat [club/marque] automobile", "PSG", "Ligue 1", "NBA", "collab", "édition limitée".
3. F1 et pilotes people : "Hamilton", "Leclerc", "Verstappen", "Russell", "Norris", "Gasly", "Ocon", "académie", "karting".
4. Mode, luxe, musique x auto : "rappeur voiture", "Louis Vuitton", "Bentley", "Rolls-Royce", "Ferrari collab".
5. Sites FR : lautomobiliste.fr, caradisiac, autoplus, largus, sponsoring.fr.

## DÉJÀ PROGRAMMÉ 13/11
12:30 PSG x Bentley, 15:00 plaques perso, 20:30 Russell GR63. Le cycle du 13/11 ajoute le Reel 18:30 et éventuellement un post 17:00 ou 21:30 si actu chaude.

## Note 14/11 (Alexis)
Un sujet déjà traité sous un angle (ex. Lotus) peut mériter un post dédié sous l'angle FR (Renault/Geely V8 Horse) : ne pas l'écarter comme doublon si l'angle et l'audience diffèrent.

## Retour Alexis 18/11
Le Reel Aston Martin Dreadnought (Dakar, Alonso/Loeb, photos officielles) a très très bien marché. Privilégier en Reel : révélation officielle du jour + nom fort (pilote, star, marque mythique) + photos officielles spectaculaires + histoire (jeu vidéo, film, record). Viser 2 Reels/jour quand il y a 2 sujets de ce niveau.
