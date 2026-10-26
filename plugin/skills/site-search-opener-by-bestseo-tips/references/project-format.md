# Project file format

The same JSON the Site Search Opener web app exports and imports (Settings, then Export/Import Projects).

```json
{
  "app": "sitesearch-opener",
  "version": 2,
  "projects": [
    {
      "name": "HR software",
      "own": ["yoursite.com"],
      "competitors": ["competitor-a.com", "competitor-b.com/blog/"]
    }
  ]
}
```

- `name`: any label, for example a product line or a client.
- `own` and `competitors`: domains or folders. Lower case, no `https://`, no `www.`. Folders end with a slash.
- A domain should not be in both lists. If it is, keep it in `own`.
- Extra top-level keys, such as `generator` and `created`, are ignored by the web app.

`build-project-file` writes this format, checks every domain first and can merge into an existing file. `run-recipe` accepts it as `project_json`, and picks `own` or `competitors` based on the recipe.
