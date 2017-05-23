const Promise = require('bluebird')
const TwitterPackage = require('twitter')
const MarkovPackage = require('markov')

const secret = {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}

const Twitter = new TwitterPackage(secret);
const markov = MarkovPackage(1);
module.exports = {Twitter, markov}

//Listen for tweets that contain the text '@BottyMcGee'
Twitter.stream('statuses/filter', { track: '@BottyMcGee' }, function (stream) {
    stream.on('data', function (tweet) {
        let response = ''
        let atString = `@${tweet.user.screen_name}`
        let params = { screen_name: tweet.user.screen_name };

        //Fetch and clean the most recent tweets of the user who tweeted '@BottyMcGee'
        Twitter.get('statuses/user_timeline', params, function (error, tweets, response) {
            if (!error) {
                let tweetStr = ''
                tweets.forEach(tweet => {
                    let filteredText = tweet.text.split(' ')
                        .filter(word => !(word.includes('@') || word.includes('/') || word.includes(';')))
                        .join(' ')
                    tweetStr += ` ${filteredText}`
                })

                //Seed the Markov Package with the user's tweetStr    
                markov.seed(tweetStr, function () {
                    //Returns two-word title (e.g. 'Impossible Yesterday')
                    function makeTitle() {
                        let titleArr = []
                        while (titleArr.length < 2) {
                            let word = markov.pick()
                            if (word.length > 6 && word !== titleArr[0]) titleArr.push(word)
                        }
                        return titleArr.join(' ')
                    }
                    //Returns Markov String blurb (e.g. 'a tale of the fake media has exposed the small organized rallies.')
                    function makeBlurb(title) {
                        let finalTitleWord = title.slice(title.indexOf(' ') + 1)
                        let blurb = ''
                        let blurbStarts = ['the story of', 'a look at', 'a journey from', 'how I learned', 'featuring a', 'a tale of']
                        let randomInd = Math.floor(Math.random() * blurbStarts.length)
                        let blurbBody = markov.backward(finalTitleWord, 9).join(' ')

                        blurb = `${blurbStarts[randomInd]} ${blurbBody}`
                        return blurb
                    }

                    let bookTitle = makeTitle()
                    response = `${bookTitle.toUpperCase()}: ${makeBlurb(bookTitle).toLowerCase()}.`
                })

                //Tweet the completed title at the user who tweeted '@BottyMcGee'
                Twitter.post('statuses/update', { status: `${atString} ${response}` })
                    .then(function (tweet) {
                        console.log(tweet.text);
                    })
                    .catch(function (error) {
                        throw error;
                    })
            } else {
                console.log(error)
            }
        });
        stream.on('error', function (error) {
            console.log(error);
        });
    })
})