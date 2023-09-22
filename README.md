# GitStats
GitStats is a lightweight ElectronJS app that allows you to view stats about GitHub issues on various repositories. This was created in 2023 for my High School IB Computer Science IA Project.

# Branch:rewrite
This branch is dedicated to a complete rewrite of the original GitStats app. Once completed, it will be merged into main and released under v2.

Here's why:
- I didn't know what I was doing in the original project, and ignored a lot of ElectronJS basics.
- The original is in JavaScript, and I want this rewritten into TypeScript.

# Contributing
This branch is open for contributions.

Running the code:
```
> cd GitStats/src
> npm install
> npm run full-build
> npm run start
```

# Plans for v2
- I'm not a big fan of the way I handled multiple tabs. While it was intuitive to use, Electron was not built for the way I implemented it, which was the biggest source of problems.
- Completely open filtering for data. This means...
    - Ability to view data for issues, pull requests, contributors, commits, and possibly more.
    - Ability to filter from those data. For issues/PRs, this means filtering by label, commentor, or assignee. For commits, this would mean filtering by commiter.
- Ability to export the data as a CSV file.
- Documents. In better terms, instead of adding a repository and then loading it, having a document feature that separates everything into documents. I have hopes this will make the app easier to use.