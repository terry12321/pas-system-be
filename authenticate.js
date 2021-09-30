const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const JwtStrategy = require("passport-jwt").Strategy;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const qp = require("@flexsolver/flexqp2");
const createError = require("http-errors");
const config = require("./config");
const uuid = require("uuid");
const storage = require("node-persist");
const formatError = require("./common/error_formatter");

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await qp.selectFirst(`SELECT * FROM account WHERE username = ?`, [username]);
            if (!user) {
                return done(createError(401, "Username not found!"), null);
            }

            const match = bcrypt.compareSync(password, user.password);
            if (user && match) {
                const { password, ...result } = user;
                return done(null, result);
            }
            if (user.password !== password) {
                return done(createError(401, "Incorrect password!"), null);
            }
        } catch (error) {
            return done(error, null);
        }
    })
);

//Link below is when you failed to serialize user into session
//https://stackoverflow.com/questions/19948816/error-failed-to-serialize-user-into-session

//Link below is understanding the usage of serialize
//https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

exports.getToken = function () {
    let id = uuid.v4();
    id = id.replace(/-/g, "");
    return jwt.sign({ data: id }, config.JWT_SECRET, { expiresIn: 60 * 30 });
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// opts.jwtFromRequest = ExtractJwt.passReqToCallback();
opts.secretOrKey = config.JWT_SECRET;
opts.passReqToCallback = true;

passport.use(
    new JwtStrategy(opts, async (req, jwt_payload, done) => {
        let token = req.headers.authorization;
        token = token.replace(`Bearer `, "");
        let user = await storage.getDatum(token);
        try {
            if (user === null || user === undefined || Object.keys(user).length === 0) {
                throw new Error(`You are not authorized, please login again`);
            }
            return done(null, user.value);
        } catch (err) {
            //catch if token expire or not generated
            // remove user
            // remove storage user
            await storage.removeItem(token);
            req.user = null;
            return done(err, null);
        }
    })
);

exports.verifyUser = (req, res, next) => {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (!user) {
            res.status(401).json(formatError(401, err.message));
        } else {
            req.user = user;
            next();
        }
    })(req, res, next);
};
