const { UserInputError } = require('apollo-server');
const Person = require('../models/Person');
const User = require('../models/User');

const jwt = require('jsonwebtoken');

const resolvers = {
    Query: {
      personCount: () => Person.collection.countDocumentation(),
      allPersons: (root, args) => {
        if (!args.phone) {
          return Person.find({});
        }
  
        return Person.find({ phone: { $exists: args.phone === 'YES' }});
      },
      findPerson: (root, args) => Person.findOne({ name: args.name }),
      me: (root, args, context) => {
        return context.currentUser;
      }
    },
    Person: {
      address: (root) => {
        return {
          street: root.street,
          city: root.city
        }
      }
    },
    Mutation: {
      addPerson: async (root, args, context) => {
        const person = new Person({ ...args });
        const currentUser = context.currentUser;

        if (!currentUser) {
          throw new AuthenticationError('Not authenticated')
        }
  
        try {
          await person.save();
          currentUser.friends = currentUser.friends.concat(person);
          await currentUser.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        }
  
        return person
      },
      editNumber: async (root, args) => {
        const person = await Person.findOne({ name: args.name });
        person.phone = args.phone;
  
        try {
          await person.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        }
  
        return person;
      },
      createUser: (root, args) => {
          const user = new User({ username: args.username });

          return user.save()
            .catch(error => {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            });
      },
      login: async (root, args) => {
          const user = await User.findOne({ username: args.username });

          if (!user || args.password !== 'secret') {
              throw new UserInputErrr("Wrong credentials");
          }

          const userForToken = {
              username: user.username,
              id: user._id
          }

          return { value: jwt.sign(userForToken, process.env.JWT_SECRET)}
      },
      addAsFriend: async (root, args, { currentUser }) => {
        const nonFriendAlready = (person) => 
          !currentUser.friends.map(f => f._id).includes(person._id);

        if (!currentUser) {
          throw new AuthenticationError('Not authenticated');
        }

        const person = await Person.findOne({ name: args.name });
        if (nonFriendAlready(person)) {
          currentUser.friends = currentUser.friends.concat(person);
        }

        await currentUser.save();

        return currentUser;
      }
    }
  };
  
  module.exports = { resolvers };