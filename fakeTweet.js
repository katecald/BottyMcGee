const Promise = require('bluebird')
const Twitter = require('./app').Twitter
const markov = require('./app').markov

//Set the param screen_name and run this file to simulate any user/celeb tweeting @BottyMcGee
var params = { screen_name: 'neiltyson' };
let response = ''
let atString = `@${params.screen_name}`

Twitter.get('statuses/user_timeline', params, function (error, tweets, response) {
    if (!error) {
        let tweetStr = ''
        tweets.forEach(tweet => {
            let filteredText = tweet.text.split(' ')
                .filter(word => !(word.includes('@') || word.includes('://')))
                .join(' ')
            tweetStr += ` ${filteredText}`
        })

        markov.seed(tweetStr, function () {
            function makeTitle() {
                let titleArr = []
                while (titleArr.length < 2) {
                    let word = markov.pick()
                    if (word.length > 6 && word !== titleArr[0]) titleArr.push(word)
                }
                return titleArr.join(' ')
            }

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

        Twitter.post('statuses/update', { status: `${atString} ${response}` })
            .then(function (tweet) {
                console.log('Just tweeted', tweet.text);
            })
            .catch(function (error) {
                throw error;
            })
    }
})