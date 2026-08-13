
First things first, load all variables:

<loadAll src="data/*.toml"></loadAll>

Now use the caches blogs to generate the lists:

# Home

<postList id=index title=Home></postList>

# Archive

<postList id=log title=Archive></postList>

# Notes

<postList id=notes></postList>

# Articles

<postList id=articles></postList>

# Drafts

<postList id=drafts></postList>

# Photos

This requires:
tfold -f crlf.ts org/img-photos-db.htm

<postList id=photos></postList>

# § Tags

<postList id=tags tmpl=topic></postList>

# § Topics

A page for website topics + all the tags.

<postList id=topics tmpl=topic></postList>

# Sitemap and Feed

<siteXml />
<feedXml />

# Generate the tag lists and pages

We have a listing page + a page for every single tag.

<tags>
  <postList id=tag tag="crlf" count=20/>
  <postList id=tag tag="quotes" count=14/>
  <postList id=tag tag="programming" count=14/>
  <postList id=tag tag="dev" count=12/>
  <postList id=tag tag="random" count=11/>
  <postList id=tag tag="bookmarks" count=11/>
  <postList id=tag tag="thought" count=10/>
  <postList id=tag tag="project" count=9/>
  <postList id=tag tag="twofold" count=9/>
  <postList id=tag tag="software" count=8/>
  <postList id=tag tag="trinkets" count=8/>
  <postList id=tag tag="graph" count=6/>
  <postList id=tag tag="db" count=6/>
  <postList id=tag tag="python" count=5/>
  <postList id=tag tag="life" count=5/>
  <postList id=tag tag="js" count=5/>
  <postList id=tag tag="philosophy" count=5/>
  <postList id=tag tag="learning" count=4/>
  <postList id=tag tag="intriguing" count=4/>
  <postList id=tag tag="knowledge" count=4/>
  <postList id=tag tag="image" count=4/>
  <postList id=tag tag="love" count=3/>
  <postList id=tag tag="job" count=3/>
  <postList id=tag tag="ethereum" count=3/>
  <postList id=tag tag="fun" count=3/>
  <postList id=tag tag="english" count=3/>
  <postList id=tag tag="privacy" count=3/>
  <postList id=tag tag="art" count=3/>
  <postList id=tag tag="browser" count=3/>
  <postList id=tag tag="game" count=3/>
  <postList id=tag tag="emacs" count=3/>
  <postList id=tag tag="editor" count=3/>
  <postList id=tag tag="ai" count=3/>
  <postList id=tag tag="vintage" count=3/>
  <postList id=tag tag="journal" count=2/>
  <postList id=tag tag="creativity" count=2/>
  <postList id=tag tag="ro" count=2/>
  <postList id=tag tag="macbook" count=2/>
  <postList id=tag tag="laptop" count=2/>
  <postList id=tag tag="imagination" count=2/>
  <postList id=tag tag="tools" count=2/>
  <postList id=tag tag="tips" count=2/>
  <postList id=tag tag="generative" count=2/>
  <postList id=tag tag="procedural" count=2/>
  <postList id=tag tag="theme" count=2/>
  <postList id=tag tag="IRC" count=2/>
  <postList id=tag tag="weather" count=2/>
  <postList id=tag tag="productivity" count=2/>
  <postList id=tag tag="similarity" count=2/>
  <postList id=tag tag="hashing" count=2/>
  <postList id=tag tag="comments" count=2/>
  <postList id=tag tag="inks" count=2/>
  <postList id=tag tag="archive" count=2/>
  <postList id=tag tag="memex" count=2/>
  <postList id=tag tag="mushrooms" count=2/>
  <postList id=tag tag="horror" count=1/>
  <postList id=tag tag="stories" count=1/>
  <postList id=tag tag="ideas" count=1/>
  <postList id=tag tag="success" count=1/>
  <postList id=tag tag="happiness" count=1/>
  <postList id=tag tag="mirdad" count=1/>
  <postList id=tag tag="senses" count=1/>
  <postList id=tag tag="vegetarian" count=1/>
  <postList id=tag tag="diet" count=1/>
  <postList id=tag tag="presentation" count=1/>
  <postList id=tag tag="flux" count=1/>
  <postList id=tag tag="sleep" count=1/>
  <postList id=tag tag="how-to" count=1/>
  <postList id=tag tag="know" count=1/>
  <postList id=tag tag="people" count=1/>
  <postList id=tag tag="tech" count=1/>
  <postList id=tag tag="aliens" count=1/>
  <postList id=tag tag="disclosure" count=1/>
  <postList id=tag tag="logs" count=1/>
  <postList id=tag tag="hieroglyphics" count=1/>
  <postList id=tag tag="psychology" count=1/>
  <postList id=tag tag="experts" count=1/>
  <postList id=tag tag="mind" count=1/>
  <postList id=tag tag="information" count=1/>
  <postList id=tag tag="laws" count=1/>
  <postList id=tag tag="sacrifice" count=1/>
  <postList id=tag tag="games" count=1/>
  <postList id=tag tag="e-mail" count=1/>
  <postList id=tag tag="tulpa" count=1/>
  <postList id=tag tag="mental" count=1/>
  <postList id=tag tag="movies" count=1/>
  <postList id=tag tag="science" count=1/>
  <postList id=tag tag="AI" count=1/>
  <postList id=tag tag="direction" count=1/>
  <postList id=tag tag="slow" count=1/>
  <postList id=tag tag="spelling" count=1/>
  <postList id=tag tag="grammar" count=1/>
  <postList id=tag tag="11ty" count=1/>
  <postList id=tag tag="p2p" count=1/>
  <postList id=tag tag="decentralized" count=1/>
  <postList id=tag tag="internet" count=1/>
  <postList id=tag tag="offline" count=1/>
  <postList id=tag tag="elixir" count=1/>
  <postList id=tag tag="GPG" count=1/>
  <postList id=tag tag="inspiration" count=1/>
  <postList id=tag tag="music" count=1/>
  <postList id=tag tag="ecosystems" count=1/>
  <postList id=tag tag="writing" count=1/>
  <postList id=tag tag="notebooks" count=1/>
  <postList id=tag tag="paper" count=1/>
  <postList id=tag tag="pens" count=1/>
  <postList id=tag tag="shops" count=1/>
  <postList id=tag tag="photo" count=1/>
  <postList id=tag tag="workshop" count=1/>
  <postList id=tag tag="keyboard" count=1/>
  <postList id=tag tag="plank" count=1/>
  <postList id=tag tag="linux" count=1/>
  <postList id=tag tag="wm" count=1/>
  <postList id=tag tag="wasm" count=1/>
</tags>


# About

TODO

# Author

TODO

# Projects

TODO
