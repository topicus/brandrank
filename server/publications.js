Meteor.publish('taxonomies', function () {
  return Taxonomies.find();
});

// publish dependent documents and simulate joins
Meteor.publish("tweets", function (accountName) {
  check(accountName, String);
  var re = new RegExp(accountName, 'i');
  console.log(accountName);
  return Tweets.find({text: re});
});

Meteor.publish('accounts-stats', function () {
  var self = this;
  var handleAccounts = Taxonomies.find({}).observeChanges({
    added: function (id) {
      var account = getAccountStats(id);
      self.added('accounts', id, account);
    },
    removed: function (id) {
      self.removed('accounts', id);
    }
  });

  var handleTweets = Tweets.find({}).observeChanges({
    added: function(id){
      var mentions = _.pluck(Tweets.findOne(id).entities.user_mentions,'screen_name');
      var accounts = Taxonomies.find().fetch();
      var accountNames = _.pluck(accounts, 'account');
      var account = _.intersection(accountNames, mentions);
      if(account.length){
        var changedAccount = _.findWhere(accounts, {account: account[0]});
        self.changed('accounts', changedAccount._id, getAccountStats(changedAccount._id));
      }
    }
  })
  self.ready();
  self.onStop(function () {
    handleAccounts.stop();
    handleTweets.stop();
  });
});

function getAccountStats(id){
  var account = getAccount(id);
  var re = new RegExp(account.account.split(',').join('|'), 'i');

  var positive = Tweets.find({text:re, sentiment: 'positive'}).count();
  var negative = Tweets.find({text:re, sentiment: 'negative'}).count();
  var neutral = Tweets.find({text:re, sentiment: 'neutral'}).count();
  var total = positive + negative + neutral;
  var accountWithStats = _.extend(account, {
    positive: positive,
    negative:negative,
    neutral: neutral,
    total:total
  });
  return accountWithStats;
}

function getAccountFromTweet(text){
  //var accounts = Taxonomies.find({}, );

}
function getAccount(id){
  return Taxonomies.findOne(id);
}
