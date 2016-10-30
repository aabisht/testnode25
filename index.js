var express = require("express");
var bodyParser = require("body-parser");
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');

var app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

var pageToVisit = "https://yts.ag/";

var websiteData = [];

app.set('port', (process.env.PORT || 5001));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get("/", function (req, res) {

    pageToVisit = pageToVisit+"browse-movies";

    request(pageToVisit, function (error, response, body) {

        var postList = [];
        var title, logo;

        if(error) {
            throw(error);
        }

        if(response.statusCode === 200) {

            var $ = cheerio.load(body);

            logo = $('.nav-bar .nav-logo a img').attr('src');
            title = $('.nav-bar .nav-logo a img').attr('alt');

            $('.browse-content .container section .browse-movie-wrap').each(function (i, element) {

                var imgPath = $(this).children('a').children('figure').children('img').attr('src');

                var post_movie_tags = [];
                var post_movie_catrgory = [];

                $(this).children('.browse-movie-bottom').children('.browse-movie-tags').children('a').each(function (ii, element1) {

                    var movie_tags = {
                        tag_name: $(this).text().trim(),
                        tag_url: $(this).attr('href')
                    }
                    post_movie_tags.push(movie_tags);
                });


                $(this).find('figcaption').children('h4:not(.rating)').each(function (ii, element1) {
                    var movie_category = {
                        category_name: $(this).text().trim()
                    }
                    post_movie_catrgory.push(movie_category);
                });

                var post_movie_web_app_url = "movie/"+$(this).children('.browse-movie-bottom').children('a').text().trim().replace(/\s+/g, '-').toLowerCase()+"-"+$(this).children('.browse-movie-bottom').children('.browse-movie-year').text().trim();
                console.log(post_movie_web_app_url);

                var posts = {
                    post_movie_title: $(this).children('.browse-movie-bottom').children('a').text().trim(),
                    post_movie_web_url: $(this).children('.browse-movie-bottom').children('a').attr('href'),
                    post_movie_app_url:post_movie_web_app_url,
                    post_movie_year: $(this).children('.browse-movie-bottom').children('.browse-movie-year').text().trim(),
                    post_movie_rating: $(this).find('.rating').text().trim(),
                    post_movie_tags: post_movie_tags,
                    post_movie_catrgory: post_movie_catrgory
                };
                postList.push(posts);

            });

            websiteData = {
                title: title,
                logo: logo,
                posts : postList
            }
        }
        return res.send(websiteData);
    });

});




var requestUrl = "";

app.get('/movie/:title-:year', function (req, res) {
    requestUrl = pageToVisit+"movie/"+req.params.title+"-"+req.params.year;

    request(requestUrl, function (error, response, body) {
        var postPageData = [];

        if(error) {
            throw(error);
        }

        if(response.statusCode === 200) {
            var $ = cheerio.load(body);

            var self = $('#movie-content');

            var movieQuality = [],
                relatedMovies = [],
                movieScreenShoot = [],
                movieCastDetails = [],
                techSpecs = [],
                commentContent = [];

            self.find('#movie-info > p').children('a').each(function (ii, element1) {
                var movie_quality = {
                    name: $(this).text().trim(),
                    url: $(this).attr('href')
                }
                movieQuality.push(movie_quality)
            });

            self.find('#movie-related > a').each(function (ii, element1) {
                var related_movies = {
                    movie_name: $(this).attr('title'),
                    movie_web_url: $(this).attr('href'),
                    movie_app_url: 'movie/'+$(this).attr('title').replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase(),
                    movie_poster: $(this).children('img').attr('data-cfsrc')
                }
                relatedMovies.push(related_movies);
            });

            self.find('#screenshots > .screenshot').each(function (ii, element1) {
                var type="";
                $(this).children('a:first-child').hasClass('youtube')?type = 'youtube':type = 'image';
                var screenShoots = {
                    img_path: $(this).children('a:first-child').attr('href'),
                    type: type
                }
                movieScreenShoot.push(screenShoots)
            });

            self.find('#crew').find('.actors > .list-cast').each(function (ii, element1) {
                var movie_cast_details = {
                    movie_cast_name: $(this).find('.list-cast-info').children('a.name-cast').text().trim(),
                    movie_cast_name_as: $(this).find('.list-cast-info').text().trim().replace($(this).find('.list-cast-info').children('a.name-cast').text().trim(), ''),
                    movie_cast_avatar: $(this).find('.avatar-thumb').children('img').attr('data-cfsrc'),
                    movie_cast_web_url: $(this).find('.list-cast-info').children('a.name-cast').attr('href'),
                    movie_cast_app_url: 'browse-movies/'+$(this).find('.list-cast-info').children('a.name-cast').text().trim().replace(' ', '%20')
                }
                movieCastDetails.push(movie_cast_details);
            });

            var i = 1;
            self.find('#movie-tech-specs').find('.tech-spec-info').each(function (ii, element1) {
                var movies_tech_specs = {
                    file_size: $(this).children('.row:first-child').find('.tech-spec-element:nth-child(1)').text().trim(),
                    resolution: $(this).children('.row:first-child').find('.tech-spec-element:nth-child(2)').text().trim(),
                    language: $(this).children('.row:first-child').find('.tech-spec-element:nth-child(3)').text().trim(),
                    mpa_rating: $(this).children('.row:first-child').find('.tech-spec-element:nth-child(4)').text().trim(),
                    frame_rate: $(this).children('.row:last-child').find('.tech-spec-element:nth-child(2)').text().trim(),
                    runtime: $(this).children('.row:last-child').find('.tech-spec-element:nth-child(3)').text().trim(),
                    peers_seeds: $(this).children('.row:last-child').find('.tech-spec-element:nth-child(4)').text().replace('P/S', '').trim(),
                    position: i
                }
                i++;
                techSpecs.push(movies_tech_specs)
            });

            console.log(self.find('#comments').children('.comment').html());
            self.find('#comments .comment').each(function (ii, element1) {
                var comment_text = {
                    user_avatar: $(this).html()
                }
                commentContent.push(comment_text);
            });

            var pageData = {
                movie_name: self.find('#mobile-movie-info').children('h1').text().trim(),
                movie_year: self.find('#mobile-movie-info').children('h1+h2').text().trim(),
                movie_category: self.find('#mobile-movie-info').children('h1+h2+h2').text().trim(),
                movie_poster: self.find('#movie-poster > img').attr('data-cfsrc'),
                movie_imdb_url: self.find('#movie-info .rating-row[itemprop="aggregateRating"]').children('a').attr('href'),
                movie_imdb_rating_value: self.find('#movie-info .rating-row[itemprop="aggregateRating"]').children('span[itemprop="ratingValue"]').text().trim(),
                movie_description: self.find('#synopsis').children('h3+p').text().trim(),
                movie_director_details: [
                    {
                        director_name: self.find('#crew').children('.directors').find('.name-cast').text().trim(),
                        director_avatar: self.find('#crew').children('.directors').find('.avatar-thumb').children('img').attr('data-cfsrc'),
                        director_related_movies_web_url: self.find('#crew').children('.directors').find('.name-cast').attr('href'),
                        director_related_movies_app_url: 'browse-movies/'+self.find('#crew').children('.directors').find('.name-cast').text().trim().replace(' ', '%20')
                    }
                ],
                movie_cast_details: movieCastDetails,
                movies_tech_specs: techSpecs,
                movie_screen_shoot: movieScreenShoot,
                movie_quality: movieQuality,
                related_movie: relatedMovies,
                comments: [
                    {
                        comment_num : self.find('#movie-comments > h3 #comment-count').text().trim(),
                        comment_text: commentContent
                    }
                ]
            }


            console.log(pageData);
            postPageData.push(pageData);
        }
        return res.send(postPageData);
    });

});

