# Nginx Certificates for Local Development (Self-Signed)

For local development, you'll need self-signed SSL certificates for Nginx to enable HTTPS.
These certificates are NOT trusted by browsers by default and will cause security warnings.
For production, use certificates from a trusted Certificate Authority (e.g., Let's Encrypt).

To generate self-signed certificates:

1.  Navigate to the `nginx/certs` directory:
    ```bash
    cd my_secure_app/nginx/certs
    ```

2.  Run the following OpenSSL command to generate a key and certificate:
    ```bash
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout localhost.key -out localhost.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    ```
    This command will:
    *   `req -x509`: Generate a self-signed certificate.
    *   `-nodes`: No encryption for the private key (convenient for local, but NOT secure for production).
    *   `-days 365`: Certificate valid for 365 days.
    *   `-newkey rsa:2048`: Generate a new 2048-bit RSA private key.
    *   `-keyout localhost.key`: Output private key to `localhost.key`.
    *   `-out localhost.crt`: Output certificate to `localhost.crt`.
    *   `-subj "/C=.../CN=localhost"`: Set subject fields. Crucially, `CN=localhost` is needed for local testing.

After running this, you should have `localhost.key` and `localhost.crt` in the `nginx/certs` directory. These will be automatically mounted into the Nginx container by `docker-compose.yml`.

To avoid browser warnings, you might need to manually trust `localhost.crt` in your operating system's certificate store.