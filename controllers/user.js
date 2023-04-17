const { SignUp } = require("../models/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const _ = require("lodash");

module.exports = {
  //signUp API................................................................
  signUp: async (req, res) => {
    try {
      const { firstname, lastname, email, password } = req.body;
      if (!firstname || !lastname || !email || !password) {
        throw { status: 400, message: "Required fields cannot be empty." };
      }
      const emailfound = await SignUp.findOne({
        where: {
          email: email,
        },
      });
      if (emailfound) {
        throw { status: 409, message: "email already exists." };
      }

      const salt = await bcrypt.genSalt(10);
      const hashedpassword = await bcrypt.hash(password, salt);
      let userNew = await SignUp.create({
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: hashedpassword,
      });
      const customer = await stripe.customers.create({
        name: userNew.firstname + " " + userNew.lastname,
        email: userNew.email,
      });
      let updatedUser = await SignUp.update(
        {
          customer_stripe_id: customer.id,
        },
        {
          where: { id: Number(userNew.dataValues.id) },
          returning: true,
        }
      );
      const user = await SignUp.findOne({
        where: {
          id: Number(userNew.dataValues.id),
        },
      });
      const token = jwt.sign(
        {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          customer_stripe_id: user.customer_stripe_id,
          isverified: user.isverified,
          isSucbscription: user.isSucbscription,
          current_period_start: user.current_period_start,
          current_period_end: user.current_period_end,
        },
        process.env.jwtPrivateKey
      );
      await userNew.save();
      const link = `http://vimentobackend-env.eba-dmebp3sv.eu-west-1.elasticbeanstalk.com/verified/${token}`;

      await sendEmail(
        email,
        "wal@k2x.tech",
        `<div>
                    Click the link below to verify your email<br/>
                    <a href="${link}">Verify Email</a>
                </div>`
      );
      return res.status(200).send({
        message: "Verificarion link has been successfully sent to your inbox",
      });
    } catch (err) {
      console.log(err);
      return res
        .status(err.status || 500)
        .send(err.message || "Something went wrong...");
    }
  },
  Verified: async (req, res) => {
    try {
      const token = req.params.token;
      const decoded = jwt.verify(token, process.env.jwtPrivateKey);
      const user = decoded;
      let updatedUser = await SignUp.update(
        {
          isverified: true,
        },
        {
          where: { id: user.id },
          returning: true,
        }
      );
      const userafter = await SignUp.findOne({
        where: { id: user.id },
      });
      return res.send(userafter);
    } catch (err) {
      console.log(err);
      return res
        .status(err.status || 500)
        .send(err.message || "Something went wrong...");
    }
  },
  //logIn API................................................................
  logIn: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw { status: 400, message: "Required fields cannot be empty." };
      }
      const user = await SignUp.findOne({
        where: {
          email: email,
        },
      });
      console.log(password);
      if (!user) {
        throw { status: 409, message: "Invalid email " };
      }

      let validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword)
        return res.status(400).send("Invalid email or password.");
      const token = jwt.sign(
        {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          picture:user.picture
        },
        process.env.jwtPrivateKey
      );
      res.send(token);
    } catch (err) {
      return res
        .status(err.status || 500)
        .send(err.message || "Something went wrong...");
    }
  },
};
