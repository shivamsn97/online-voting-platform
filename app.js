const express = require("express");
const csurf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const app = express();
const { User, answers, voters, questions, election } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const connectEnsureLogin = require("connect-ensure-login");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser("7654ertyuhjbnvgftrfg9873yugqwehjbsd")); // Obivioulsy, this secret is public. Don't do this in production. Applies to other secrets in this file too.
app.use(csurf("897ygu328437twgetuyvas867ygusbhj", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");

app.use(
  session({
    secret: "87rtwegubdsu87e47w2gwyeuabjshefrgus",
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        User.findOne({ where: { email: email } }).then((user) => {
          if (!user) {
            return done(null, false, { message: "Incorrect email" });
          }
          bcrypt.compare(password, user.password, (err, res) => {
            if (res) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Incorrect password" });
            }
          });
        });
      } catch (err) {
        return err;
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log("deserializing user from session", id);
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.get("/", (request, response) => {
  // check if user is logged in
  if (request.user) {
    // redirect to dashboard
    return response.redirect("/dashboard");
  }
  response.render("index", {
    csrfToken: request.csrfToken(),
    title: "Online Voting Platform",
  });
});

app.get("/healthz", (req, res) => {
  // This is a health check endpoint for render which always returns 200
  res.status(200).send("OK");
});

app.get("/signup", (request, response) => {
  // check if user is logged in
  if (request.user) {
    // redirect to dashboard
    return response.redirect("/dashboard");
  }
  response.render("signup", {
    csrfToken: request.csrfToken(),
    title: "Signup",
  });
});

app.post("/users", async (request, response) => {
  // check if user is logged in
  if (request.user) {
    // redirect to dashboard
    return response.redirect("/dashboard");
  }
  const firstName = request.body.firstName;
  const lastName = request.body.lastName;
  const email = request.body.email;
  if (!firstName || !email || !request.body.password) {
    request.flash("error", "Please fill in all fields");
    return response.redirect("/signup");
  }
  const password = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.status(500).send("Error logging in");
      } else {
        response.redirect("/dashboard");
      }
    });
  } catch (error) {
    request.flash("error", "Email already exists");
    response.redirect("/signup");
  }
});

app.get("/login", (request, response) => {
  response.render("login", {
    csrfToken: request.csrfToken(),
    title: "Login",
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/dashboard");
  }
);

app.get(
  "/signout",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response, next) => {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      return response.redirect("/");
    });
  }
);

app.get(
  "/dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const elections = await election.findAll({
      where: {
        user_id: request.user.id,
      },
    });
    response.render("dashboard", {
      csrfToken: request.csrfToken(),
      title: "Dashboard",
      elections: elections,
    });
  }
);

app.post(
  "/election/create",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const title = request.body.title;
    await election.create({
      title: title,
      user_id: request.user.id,
    });
    response.redirect("/dashboard");
  }
);

app.get("/election/:id", async (request, response) => {
  const electionId = request.params.id;
  // domain = https://
  const domain = request.protocol + "://" + request.get("host");
  const electionData = await election.findOne({
    where: {
      id: electionId,
    },
  });
  const all_voters = await voters.findAll({
    where: {
      election_id: electionId,
    },
  });
  const all_questions = await questions.findAll({
    where: {
      election_id: electionId,
    },
  });
  if (!electionData) {
    return response.status(404).send("Election not found");
  }
  if (!request.user || electionData.user_id !== request.user.id) {
    return response.render("election/view_public", {
      election: electionData,
      questions: all_questions,
    });
  }
  response.render("election/view", {
    csrfToken: request.csrfToken(),
    election: electionData,
    candidates: all_voters,
    questions: all_questions,
    domain: domain,
  });
});

app.post(
  "/election/:id/question",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionId = request.params.id;
    const electionData = await election.findOne({
      where: {
        id: electionId,
      },
    });
    if (!electionData) {
      return response.status(404).send("Election not found");
    }
    if (!request.user || electionData.user_id !== request.user.id) {
      return response.status(403).send("Unauthorized");
    }
    const question = request.body.question;
    const description = request.body.description;
    await questions.create({
      title: question,
      election_id: electionId,
      description: description,
    });
    response.redirect("/election/" + electionId);
  }
);

app.get(
  "/election/:id/question/:question_id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionId = request.params.id;
    const electionData = await election.findOne({
      where: {
        id: electionId,
      },
    });
    if (!electionData) {
      return response.status(404).send("Election not found");
    }
    if (!request.user || electionData.user_id !== request.user.id) {
      return response.status(403).send("Unauthorized");
    }
    const questionId = request.params.question_id;
    const questionData = await questions.findOne({
      where: {
        id: questionId,
      },
    });
    const answersData = await answers.findAll({
      where: {
        question_id: questionId,
      },
    });
    response.render("election/question", {
      csrfToken: request.csrfToken(),
      election: electionData,
      question: questionData,
      answers: answersData,
    });
  }
);

app.post(
  "/election/:id/question/:question_id/answer",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionId = request.params.id;
    const electionData = await election.findOne({
      where: {
        id: electionId,
      },
    });
    if (!electionData) {
      return response.status(404).send("Election not found");
    }
    if (!request.user || electionData.user_id !== request.user.id) {
      return response.status(403).send("Unauthorized");
    }
    const questionId = request.params.question_id;
    const answer = request.body.answer;
    await answers.create({
      value: answer,
      question_id: questionId,
    });
    response.redirect("/election/" + electionId + "/question/" + questionId);
  }
);

app.delete(
  "/election/:id/question/:question_id/answer/:answer_id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionId = request.params.id;
    const electionData = await election.findOne({
      where: {
        id: electionId,
      },
    });
    if (!electionData) {
      return response.status(404).send("Election not found");
    }
    if (!request.user || electionData.user_id !== request.user.id) {
      return response.status(403).send("Unauthorized");
    }
    const questionId = request.params.question_id;
    const answerId = request.params.answer_id;
    await answers.destroy({
      where: {
        id: answerId,
      },
    });
    // if content-type is application/json, then we need to send a response
    if (request.headers["content-type"] === "application/json") {
      return response.json({
        success: true,
      });
    }
    response.redirect("/election/" + electionId + "/question/" + questionId);
  }
);

app.delete(
  "/election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionId = request.params.id;
    const electionData = await election.findOne({
      where: {
        id: electionId,
      },
    });
    if (!electionData) {
      return response.status(404).send("Election not found");
    }
    if (!request.user || electionData.user_id !== request.user.id) {
      return response.status(403).send("Unauthorized");
    }
    await election.destroy({
      where: {
        id: electionId,
      },
    });
    // if content-type is application/json, then we need to send a response
    if (request.headers["content-type"] === "application/json") {
      return response.json({
        success: true,
      });
    }
    response.redirect("/dashboard");
  }
);

app.delete(
  "/election/:id/question/:qid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionId = request.params.id;
    const electionData = await election.findOne({
      where: {
        id: electionId,
      },
    });
    if (!electionData) {
      return response.status(404).send("Election not found");
    }
    if (!request.user || electionData.user_id !== request.user.id) {
      return response.status(403).send("Unauthorized");
    }
    const questionId = request.params.qid;
    await questions.destroy({
      where: {
        id: questionId,
      },
    });
    // if content-type is application/json, then we need to send a response
    if (request.headers["content-type"] === "application/json") {
      return response.json({
        success: true,
      });
    }
    response.redirect("/election/" + electionId);
  }
);

app.post(
  "/election/:id/launch",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionId = request.params.id;
    const electionData = await election.findOne({
      where: {
        id: electionId,
      },
    });
    if (!electionData) {
      return response.status(404).send("Election not found");
    }
    if (!request.user || electionData.user_id !== request.user.id) {
      return response.status(403).send("Unauthorized");
    }
    await election.update(
      {
        is_live: true,
      },
      {
        where: {
          id: electionId,
        },
      }
    );
    response.redirect("/election/" + electionId);
  }
);

app.post(
  "/election/:id/end",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionId = request.params.id;
    const electionData = await election.findOne({
      where: {
        id: electionId,
      },
    });
    if (!electionData) {
      return response.status(404).send("Election not found");
    }
    if (!request.user || electionData.user_id !== request.user.id) {
      return response.status(403).send("Unauthorized");
    }
    await election.update(
      {
        is_live: false,
      },
      {
        where: {
          id: electionId,
        },
      }
    );
    response.redirect("/election/" + electionId + "/results");
  }
);

module.exports = app;
