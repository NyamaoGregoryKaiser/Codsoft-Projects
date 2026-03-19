-- V1__initial_setup.sql

-- Create roles table
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE
);

-- Insert initial roles
INSERT INTO roles (name) VALUES ('ROLE_USER');
INSERT INTO roles (name) VALUES ('ROLE_ADMIN');

-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(120) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create user_roles join table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Seed an admin user (password 'adminpass')
-- NOTE: The password hash below is a placeholder. In a real application,
--       generate it using BCryptPasswordEncoder. For example, in Java:
--       new BCryptPasswordEncoder().encode("adminpass")
INSERT INTO users (username, email, password, created_at, updated_at)
VALUES (
    'admin',
    '$2a$10$wN3tVq0B.9D2mZ5y.rC4XOw.M.D8fB.W.J.T.gK.Z.Q.1.D.4.E.5.F.6.G.7.H.8.I.9.J.K.L.M.N.O.P.Q.R.S.T.U.V.W.X.Y.Z.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z/A/B/C/D/E/F/G/H/I/J/K/L/M/N/O/P/Q/R/S/T/U/V/W/X/Y/Z/0/1/2/3/4/5/6/7/8/9/+/=', -- Hashed 'adminpass'
    'admin@example.com',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign ROLE_ADMIN to the admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';

-- Seed a regular user (password 'userpass')
-- NOTE: The password hash below is a placeholder. Generate it similarly.
--       new BCryptPasswordEncoder().encode("userpass")
INSERT INTO users (username, email, password, created_at, updated_at)
VALUES (
    'user',
    '$2a$10$N2k/nFpZ.M.Q.R.S.T.U.V.W.X.Y.Z/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s.t.u.v.w.x.y.z/A/B/C/D/E/F/G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U.V.W.X.Y.Z/0/1/2/3/4/5/6/7/8/9/+/=', -- Hashed 'userpass'
    'user@example.com',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign ROLE_USER to the regular user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'user' AND r.name = 'ROLE_USER';
```

---

**3. Configuration & Setup**

**`Dockerfile`**
```dockerfile