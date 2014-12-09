var twitter = Meteor.npmRequire('twitter');
var twit = null;
var tstream = null;

Meteor.startup(function () {
  twit = new twitter({
    consumer_key: Meteor.settings.twitter.consumer_key,
    consumer_secret: Meteor.settings.twitter.consumer_secret,
    access_token_key: Meteor.settings.twitter.access_token_key,
    access_token_secret: Meteor.settings.twitter.access_token_secret
  });
  Meteor.call('startStream');
});

Meteor.methods({
  startStream: function(){
    var txs = Taxonomies.find().fetch();
    var keywords = _.flatten(_.pluck(txs, 'account')).join(',');
    var params = {};
    params.track = keywords;
    tstream && tstream.destroy();
    keywords && twit.stream('statuses/filter', params,
      Meteor.bindEnvironment(function(stream) {
      tstream = stream;
      stream.on('data', Meteor.bindEnvironment(function(data) {
          try{
            classify(data.text, function(sentiment){
              data.sentiment = sentiment;
              Tweets.insert(data);
            });
          } catch(e){
            console.log(e);
          }

      }));
    }));
  },
  stopStream: function(){
    tstream.destroy();
  },
  addAccount: function(account){
    twit.get('/users/show/' + account + '.json', Meteor.bindEnvironment(function(data) {
      _.extend(data, {
        profile_image: data.profile_image_url.replace('normal', 'bigger'),
        profile_banner_url: data.profile_banner_url,
        account: account,
        createdAt: new Date()
      });

      Taxonomies.insert(data);
    }));
    Meteor.call('startStream');
  },
  clear: function(){
    tstream && tstream.destroy();
    Taxonomies.remove({});
    Tweets.remove({});
  }
});


function classify(message, cb){
  var url = 'https://api.idolondemand.com/1/api/sync/analyzesentiment/v1?text=';
  url += encodeURIComponent(message);
  url += '&language=spa&apikey=' + Meteor.settings.idol_on_demand_api_key;

  HTTP.call('GET', url, function (error, result) {
    if(result.statusCode == 400){
      console.log(url);
    }
    try{
      cb(result.data.aggregate.sentiment);
    }catch(e){
      console.log(error);
      console.log('Problem calling idol on demand. Assigning neutral sentiment manually');
      cb('neutral');
    }
  });
}
