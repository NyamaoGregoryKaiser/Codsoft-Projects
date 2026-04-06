const db = require('../db');

class User {
    static tableName = 'users';

    static async create(userData) {
        const [user] = await db(User.tableName).insert(userData).returning('*');
        return user;
    }

    static async findByUsername(username) {
        return db(User.tableName).where({ username }).first();
    }

    static async findByEmail(email) {
        return db(User.tableName).where({ email }).first();
    }

    static async findById(id) {
        return db(User.tableName).where({ id }).first();
    }

    static async update(id, updates) {
        const [user] = await db(User.tableName).where({ id }).update(updates).returning('*');
        return user;
    }

    static async delete(id) {
        return db(User.tableName).where({ id }).del();
    }
}

module.exports = User;