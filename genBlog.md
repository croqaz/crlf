
First things first, load all TOML variables:

<loadAll src="data/*.toml"></loadAll>

Evaluate all Photo tags,
they are all in one file:

<evaluate file="blog/photos.md"/>

Evaluate all tags inside all blog files:

<dirList d="blog/public-*.md" intoVar="fileList"></dirList>
<duplicate tag='evaluate file="blog/{{x}}"' from={JSON.parse(fileList)}>
<evaluate file="blog/public-2007.md"/>
<evaluate file="blog/public-2010.md"/>
<evaluate file="blog/public-2011.md"/>
<evaluate file="blog/public-2012.md"/>
<evaluate file="blog/public-2013.md"/>
<evaluate file="blog/public-2014.md"/>
<evaluate file="blog/public-2015.md"/>
<evaluate file="blog/public-2016.md"/>
<evaluate file="blog/public-2017.md"/>
<evaluate file="blog/public-2018.md"/>
<evaluate file="blog/public-2019.md"/>
<evaluate file="blog/public-2020.md"/>
<evaluate file="blog/public-2021.md"/>
<evaluate file="blog/public-2022.md"/>
<evaluate file="blog/public-2023.md"/>
<evaluate file="blog/public-2024.md"/>
<evaluate file="blog/public-2025.md"/>
<evaluate file="blog/public-2026.md"/>
</duplicate>
