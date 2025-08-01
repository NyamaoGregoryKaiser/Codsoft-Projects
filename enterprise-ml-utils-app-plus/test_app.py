import pytest
import requests
import json

# ... (Add tests here using pytest, mocking database interactions where needed) ...  Example below:

def test_add_datapoint(client):
    response = client.post('/datapoints', json={'feature1': 1.0, 'feature2': 2.0, 'target': 3.0})
    assert response.status_code == 201

#Note: you need to implement a proper test client for flask.