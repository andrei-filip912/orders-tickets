import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app';
import jwt from 'jsonwebtoken';

declare global {
    var getAuthCookie: () => Promise<string[]>;
    var signin: () => string[];
}

jest.mock('../nats-wrapper');

let mongo: MongoMemoryServer;
beforeEach(async () => {
    jest.clearAllMocks();
    process.env.JWT_KEY = 'FDSSFA'; // quick and dirty fix
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    await mongoose.connect(uri);
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        await collection.deleteMany({});
    }
});

afterEach(async () => {
    mongoose.connection.close();
    await mongo.stop(); 
});

global.getAuthCookie = async () => {
    const email = 'abc@abc.com';
    const password = 'password';

    const res = await request(app)
        .post('/api/users/signup')
        .send({
            email, password
        })
        .expect(201);

    const cookie = res.get('Set-Cookie');

    return cookie;
};

global.signin = () => {
    // build a JWT payload. 
    const payload = {
        id: new mongoose.Types.ObjectId().toHexString(),
        email: 'abcd@abcd.com'
    };
    
    // create jwt
    const token = jwt.sign(payload, process.env.JWT_KEY!);

    // build session Object. { jwt: MY_JWT }
    const session = { jwt: token };

    // turn into JSON
    const sessionJSON = JSON.stringify(session);

    // encode json to base64
    const base64 = Buffer.from(sessionJSON).toString('base64');
    
    // return string with the encoded data
    return [`session=${base64}`];
}