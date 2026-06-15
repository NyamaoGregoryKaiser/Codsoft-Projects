```bash
#!/bin/bash
set -e

echo "Starting tests..."

# Check if Google Test executables exist
if [ -f "./build/UnitTests" ] && [ -f "./build/IntegrationTests" ]; then
    echo "Running C++ Unit Tests..."
    ./build/UnitTests --gtest_output="xml:./test_results/unit_tests.xml"

    echo "Running C++ Integration Tests..."
    # Ensure DB is running for integration tests
    if ! docker-compose ps db | grep -q "Up"; then
        echo "Database is not running. Please start it with 'docker-compose up -d db' first."
        exit 1
    fi
    ./build/IntegrationTests --gtest_output="xml:./test_results/integration_tests.xml"
else
    echo "C++ test executables not found in ./build/. Please build the project first (cmake .. && make)."
    exit 1
fi

# Run API Tests (Python)
echo "Running API Tests..."
# Ensure Python dependencies are installed: pip install requests
# Ensure the application is running for API tests
if ! docker-compose ps app | grep -q "Up"; then
    echo "Application is not running. Please start it with 'docker-compose up -d app' first."
    exit 1
fi
python3 tests/api/api_tests.py --junitxml=./test_results/api_tests.xml

echo "All tests completed. Check test_results/ for reports."
```