const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const JwtStrategy = require('passport-jwt').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const qp = require('@flexsolver/flexqp2');
const createError = require('http-errors');
const config = require('./config');



passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await qp.selectFirst(`SELECT * FROM account WHERE username = ?`, [username]);
    const match = await bcrypt.compareSync(password, user.password);
    if (user && match) {
        const { ...result } = user;
        return done(null, result);
    }
    if (!user) {
        return done(createError(401, 'Username not found!'), null);
    }
    if (user.password !== password) {
        return done(createError(401, 'Incorrect password!'), null);
    }
}));


passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

exports.getToken = function(user){
    return jwt.sign(user, config.secretKey, 
        {expiresIn: 3600});
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.JWT_SECRET;


passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    console.log('JWT payload: ', jwt_payload);

}));
