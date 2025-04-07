import jwt from 'jsonwebtoken';
import config from '../config/index.js';

function tokenAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send('Authorization header missing');
    }

    const tokens = authHeader.split(' ');
    const authToken = tokens[1];

    jwt.verify(authToken, config.jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).send('Unauthorized');
        } else {
            console.log(decoded);
            next();
        }
    });
}

export default tokenAuth;