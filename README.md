# Online Voting Platform

Following is a list of features that should be implemented in the online voting platform. The features that have been implemented are marked with a checkmark.

## An admin should be able to sign up

- [x] If they don’t already have an account, they should be able to sign up first.
- [x] If they are an existing user, they should be able to sign in with their email and password.
- [x] They should also be able to sign out if they'd like to.

## Admins can create elections

- [x] Signed-in admins should be able to see a list of elections they have created, and create a new one.
- [x] When creating an election, it should be possible to give a name for the election.

## Admins can create a ballot of questions in an election

- [x] Admins should be able to create a ballot - [ ] a list of questions they'd like voters to vote on.
- [x] Admins should be able to add multiple questions to the ballot.
- [x] For each question, admins should be able to fill in a short title, and a longer description.
- [x] For each question, it should be possible for the admin to add answer options; each of these answer options should be a short string.
- [ ] Admins should be able to update the question title, description, and answer options.
- [x] Admins should be able to delete questions and answer options, as long as there's at least one question in the ballot. (Remaining: validation)

## Admins can register voters

- [ ] Admins should be able to register voters in an election.
- [ ] When adding a voter, admins should enter a voter ID and a voter password.

## Admins can launch an election

- [x] Admins should be able to launch an election; this makes it possible for registered voters to visit the public page of an election and cast their vote.
- [ ] Before launching an election, the admin should be shown a preview of what the ballot looks like. Admins should be blocked from launching an election if there is something wrong with the ballot - [ ] for example, if not every question has at least two answer options.
- [ ] Once an election is launched, it should not be possible for the administrator to edit the ballot of questions.

## Elections should have a publicly accessible URL

- [x] Elections should have a public page that is visitable by all users.
- [ ] (Optional feature) It should be possible for an election administrator to set a custom path to the election page. For example: /e/my-custom-string. This lets users visit a friendly, readable URL, instead of the default /elections/:id path.
