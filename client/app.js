// client: declare collection to hold count object
Accounts = new Mongo.Collection('accounts');

Router.route('/', function () {
  this.render('Home');
});

Router.route('/account', function () {
  this.render('Account');
});


// client: subscribe to the count for the current room
Tracker.autorun(function () {
  Meteor.subscribe('accounts-stats');
  Meteor.subscribe('tweets', Session.get('accountName'));
});
console.log(Accounts.find().fetch());

Template.Home.helpers({
  taxonomies: function(){
    return Accounts.find();
  },
  toPercent: function(part, total){
    if(!part && !total) return 0;
    return ((part/total) * 100).toFixed(1);
  }
});

Template.Home.events({
  'submit .new-taxonomy': function (event) {
    var text = event.target.taxonomy.value;
    Meteor.call('addAccount', text);
    event.target.taxonomy.value = '';
    return false;
  },
  'click #clear': function(event){
    console.log('calling clear');
    Meteor.call('clear');
  },
  'click .account': function (event) {
    console.log(this.data);
    Router.go('/account');
  }
});
