const request = require('supertest');
const app = require('../app.js');

describe('Check pageRoutes', () => {
  test('index', async () => {
    const response = await request(app)
    .get('/');
    expect(response.status).toBe(200);
  });

  test('registration page', async () => {
    const response = await request(app)
    .get('/register');
    expect(response.status).toBe(200);
  });

  test('/auth-homepage', async () => {
    const response = await request(app)
    .get('/auth-homepage');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  test('/note-page : expect 404', async () => {
    const response = await request(app)
    .get('/note-page');
    expect(response.status).toBe(404);
  });

  test('/note-page/somevalue', async () => {
    const response = await request(app)
    .get('/note-page/somevalue');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  test('/collab-page : expect 404', async () => {
    const response = await request(app)
    .get('/collab-page');
    expect(response.status).toBe(404);
  });

  test('/collab-page/somevalue', async () => {
    const response = await request(app)
    .get('/collab-page/somevalue');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  test('/public-note : expect 404', async () => {
    const response = await request(app)
    .get('/public-note');
    expect(response.status).toBe(404);
  });

  test('/public-note/somevalue', async () => {
    const response = await request(app)
    .get('/public-note/somevalue');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });
});
