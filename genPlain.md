
<loadAll src="data/*.toml"></loadAll>

Generate plain HTML pages like "about", "author", etc.

<plainRender in="tmpl/plain.html" out="output/about.html" title="About" markdown="~/Documents/org/public/about.md" />

<plainRender in="tmpl/plain.html" out="output/author.html" title="Author" markdown="~/Documents/org/public/author.md" />

<plainRender in="tmpl/plain.html" out="output/projects.html" title="Project" markdown="~/Documents/org/public/projects.md" />
