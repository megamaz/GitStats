# GitStats
GitStats is a lightweight ElectronJS app that allows you to view stats about GitHub issues on various repositories. This was created in 2023 for my High School IB Computer Science IA Project.

# Contributing
This branch is open for contributions.

Running the code:
```
> cd GitStats/src
> npm install
> npm run full-build
> npm run start
```
I recommend you create a `userdata.json` file inside the `src` directory, so that it can be copied inside the `dist` foler on build. Here's a sample `userdata.json` file:
```json
{
    "usertoken":"your token",
    "savedrepos":["megamaz/GitStats"]
}
```

# Plans for v2
- Completely open filtering for data. This means...
    - Ability to view data for
        - [x] Issues
        - [x] Pull Requests
        - [ ] Contributors
        - [ ] Commits
        - And possibly more.
    - Ability to filter from those data.
        - Issues / PR:
            - [X] Labels
            - [X] Assignee
            - [X] Issue / PR Type
- [ ] Ability to export the data as a CSV file.
- *I am not a frontend designer.* The current frontend may not look best, but that's simply not what I do. If someone wants to PR something better, I would really appreciate it. 