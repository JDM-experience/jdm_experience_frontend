# Development workflow (Jira)

How work moves from a Jira ticket to production. See [README.md § Project info](../README.md#project-info)
for the Jira board link and main contact.

## Branches

| Branch | Environment |
|---|---|
| `main` | Production |
| `dev` | Development |

## Branch naming

Every change starts from a Jira ticket on the JEA board. Branch names are the ticket number and
title:

```
TICKETNUMBER-TICKETTITLE
```

e.g. `JEA-42-add-docx-export`.

## Flow

1. Pick a ticket from the JEA board.
2. Cut a branch off `dev`, named per the convention above.
3. Open the PR back into `dev`.
4. `dev` gets merged into `main` for a production release.
