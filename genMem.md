
First things first, load all TOML variables:
<loadAll src="data/*.toml"></loadAll>

Evaluate all tags inside all mem files:
( this may need to be run twice,
first just to populate the links/ backlinks DB )
<evaluateAll src="mem/*.md"></evaluateAll>

# Optional

Maybe I don't need to run this here.
Refresh links/ backlinks for all mem files:
<dirList d="mem/ZZZ*.md" intoVar="fileList"></dirList>
<duplicate tag='renderFile file="mem/{{x}}"' from={JSON.parse(fileList)}>
</duplicate>
