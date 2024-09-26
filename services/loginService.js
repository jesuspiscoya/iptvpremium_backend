const MysqlService = require("./mysqlService");
const jwt = require("jsonwebtoken");

class LoginService {
  constructor() {
    this.mysql = new MysqlService().getConnection();
    this.SECRET = process.env.SECRET_KEY;
  }

  login = async ({ email, password }) => {
    const [user] = await this.mysql.query(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    const token = jwt.sign(
      { email: email, exp: Date.now() + 12 * 60 * 60 * 1000 },
      this.SECRET
    );

    return {
      id: user[0].id,
      firstname: user[0].firstname,
      lastname: user[0].lastname,
      email: user[0].email,
      state: user[0].state,
      token: token,
    };
  };
}

module.exports = LoginService;
