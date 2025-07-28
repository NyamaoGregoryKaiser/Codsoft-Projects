#ifndef USER_H
#define USER_H

//Structure to represent a user
struct User {
    int id;
    std::string username;
    std::string password; //In reality, should be a hash
};

#endif