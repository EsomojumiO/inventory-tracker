const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const { User } = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL || 'http://localhost:5001/api'}/auth/google/callback`,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ 'google.id': profile.id });

        if (!user) {
            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // Link Google account to existing user
                user.google = {
                    id: profile.id,
                    email: profile.emails[0].value
                };
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
                    email: profile.emails[0].value,
                    google: {
                        id: profile.id,
                        email: profile.emails[0].value
                    },
                    password: Math.random().toString(36).slice(-8), // Random password for OAuth users
                    role: 'user'
                });
            }
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// Apple Strategy
passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
    callbackURL: `${process.env.API_URL || 'http://localhost:5001/api'}/auth/apple/callback`,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, idToken, profile, done) => {
    try {
        let user = await User.findOne({ 'apple.id': profile.id });

        if (!user) {
            // Check if user exists with same email
            user = await User.findOne({ email: profile.email });

            if (user) {
                // Link Apple account to existing user
                user.apple = {
                    id: profile.id,
                    email: profile.email
                };
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    username: profile.name.firstName.toLowerCase() + Math.random().toString(36).slice(-4),
                    email: profile.email,
                    apple: {
                        id: profile.id,
                        email: profile.email
                    },
                    password: Math.random().toString(36).slice(-8), // Random password for OAuth users
                    role: 'user'
                });
            }
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

module.exports = passport;
