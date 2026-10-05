require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AuthService } = require('../dist/modules/auth/auth.service');
const { AuthGuard } = require('../dist/modules/auth/auth.guard');
const { JwtService } = require('@nestjs/jwt');
const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { RegisterDto, RoleDto } = require('../dist/modules/auth/auth.dto');
const jwt = new JwtService({ secret: 'test-secret-that-is-at-least-32-characters' });
test('registration hashes password, hides hash, login verifies password', async () => {
 let saved;
 const users = {
  create: async data => (saved = { ...data, id: 'user-1', role: null, authorityApproved: false }),
  findOne: ({ email }) => ({ select: async () => email === saved.email ? saved : null }),
 };
 const service = new AuthService(users, jwt);
 const session = await service.register({ fullName: 'Test Seeker', email: 'TEST@example.com', password: 'testpassword', acceptTerms: true });
 assert.equal(saved.email, 'test@example.com');
 assert.notEqual(saved.passwordHash, 'testpassword');
 assert.equal(session.user.passwordHash, undefined);
 assert.equal(jwt.verify(session.token).sub, 'user-1');
 assert.equal((await service.login({ email: 'test@example.com', password: 'testpassword' })).user.id, 'user-1');
 await assert.rejects(service.login({ email: 'test@example.com', password: 'incorrect' }), /incorrect/);
 await assert.rejects(service.login({ email: 'unknown@example.com', password: 'testpassword' }), /incorrect/);
});
test('role selection is one-time and never grants authority approval', async () => {
 let query, update;
 const service = new AuthService({ findOneAndUpdate: async (q, u) => {
  query = q; update = u; return { id: 'user-1', fullName: 'Test', email: 'test@example.com', role: u.$set.role, authorityApproved: false };
 } }, jwt);
 const session = await service.selectRole('user-1', 'AUTHORITY');
 assert.deepEqual(query, { _id: 'user-1', role: null });
 assert.deepEqual(update, { $set: { role: 'AUTHORITY' } });
 assert.equal(session.user.authorityApproved, false);
 const alreadySet = new AuthService({ findOneAndUpdate: async () => null }, jwt);
 await assert.rejects(alreadySet.selectRole('user-1', 'AUTHORITY'), /already set/);
});
test('duplicate accounts return actionable conflict', async () => {
 const service = new AuthService({ create: async () => { throw { code: 11000 }; } }, jwt);
 await assert.rejects(service.register({ fullName: 'Test', email: 'test@example.com', password: 'testpassword', acceptTerms: true }), /already exists/);
});
test('DTO rejects unknown roles, missing terms and weak passwords', async () => {
 assert.ok((await validate(plainToInstance(RoleDto, { role: 'ADMIN' }))).length);
 assert.ok((await validate(plainToInstance(RoleDto, { role: 'GUIDE' }))).length);
 assert.equal((await validate(plainToInstance(RoleDto, { role: 'AUTHORITY' }))).length, 0);
 assert.ok((await validate(plainToInstance(RegisterDto, { fullName: 'T', email: 'bad', password: 'short', acceptTerms: false }))).length >= 4);
});
test('guard rejects missing, forged and expired tokens', () => {
 const guard = new AuthGuard(jwt);
 const context = auth => ({ switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: auth } }) }) });
 assert.throws(() => guard.canActivate(context(undefined)));
 assert.throws(() => guard.canActivate(context('Bearer forged')));
 assert.throws(() => guard.canActivate(context('Bearer ' + jwt.sign({ sub: 'user-1' }, { expiresIn: -1 }))));
 assert.equal(guard.canActivate(context('Bearer ' + jwt.sign({ sub: 'user-1' }))), true);
});
test('legacy guide accounts merge into authority without gaining approval', async () => {
 let query, update;
 const service = new AuthService({ collection: { updateMany: async (q, u) => { query = q; update = u; } } }, jwt);
 await service.onModuleInit();
 assert.deepEqual(query, { role: 'GUIDE' });
 assert.deepEqual(update, { $set: { role: 'AUTHORITY', authorityApproved: false } });
});
