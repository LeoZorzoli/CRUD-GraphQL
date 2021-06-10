const { ApolloServer } = require('apollo-server');
require('dotenv').config()
const mongoose = require('mongoose');

const { typeDefs } = require('./graphql/typedefs');
const { resolvers } = require('./graphql/resolvers');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB', error.message);
  });

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decodedToken.id).populate('friends');
      return { currentUser };
    }
    
  }
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});