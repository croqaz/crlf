
<loadAll src="data/*.toml"></loadAll>

Generate plain HTML pages like "about", "author", etc.

<plainRender in="tmpl/plain.html" out="about/index.html" title="About" markdown="~/Documents/org/public/about.md" />

<plainRender in="tmpl/plain.html" out="author/index.html" title="Author" markdown="~/Documents/org/public/author.md" />

<plainRender in="tmpl/plain.html" out="projects/index.html" title="Project" markdown="~/Documents/org/public/projects.md" />
