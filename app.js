
// import main, { add, subtract } from './math.js'
// console.log(add(1, 2))
// console.log(subtract(2, 1))
// main()

//Please add all Javascript code to this file.

//Selects the App element in the html
const app = document.querySelector('#app')

//Our state object and array -> used by render function
const state = {
  source: '',
  loading: false,
  popup: [],
  popupClass: 'loader hidden',
  searchClass: '',
  pagesFetched: 1,
  articles: [
    {
      image: '',
      title: '',
      theme: '',
      impressions: '',
      summary: '',
      link: '',
    }
  ]
}

//Fetch Any URL
function fetchUrl(url) {
  return fetch(`https://accesscontrolalloworiginall.herokuapp.com/${url}`)
}

//Mashables Articles
function fetchMashableArticles() {
  return fetchUrl('http://mashable.com/stories.json')
  .then(res => res.json())
  .then(data => {
    //console.log(data)
    return data.new.map(article => {
      return {
        image: article.feature_image,
        title: article.display_title,
        theme: article.channel,
        impressions: article.formatted_shares,
        summary: article.excerpt,
        link: article.short_url,
      }
    })
  })
}

//Reddit articles
function fetchRedditArticles() {
  return fetchUrl('https://www.reddit.com/top.json')
  .then(res => res.json())
  .then(result => {
    //console.log(result)
    return result.data.children.map(article => {
      return {
            image: article.data.thumbnail,
            title: article.data.title,
            theme: article.data.domain,
            impressions: article.data.num_comments,
            summary: article.data.title,
            link: article.data.url
          }
    })
  })
}

//Digg Articles
function fetchDiggArticles() {
  return fetchUrl('http://digg.com/api/news/popular.json')
  .then(res => res.json())
  .then(result => {
    //console.log(result)
    return result.data.feed.map(article => {
      return {
        image: article.content.media.images[0].original_url,
        title: article.content.kicker,
        theme: article.content.domain_name,
        impressions: article.diggs.count,
        summary: article.content.description,
        link: article.content.original_url
      }
    })
  })
}

//fetchArticles depending on what the source is
function fetchArticles(source) {
  if (source === 'mashable') {
    return fetchMashableArticles()
  } else if (source === 'reddit') {
    return fetchRedditArticles()
  } else if (source === 'digg') {
    return fetchDiggArticles()
  }
}

//on load, combine all 3 articles into an array and then flatten it and render
function combineArticles (mash, reddit, digg) {
  state.loading = true;
  render(app, state);
  const allArticles = []
  mash.then(mashArticles => {
    allArticles.push(mashArticles)
  }).then(
    reddit.then(redditArticles => allArticles.push(redditArticles))
  ).then(
    digg.then(diggArticles => allArticles.push(diggArticles))
  ).then(() => {
    state.articles = allArticles.reduce((acc, cur) => acc.concat(cur), [])
    //console.log(state.articles)
    state.loading = false;
    render(app, state)
  })
}

//look at promise-all in order to call them all at the same time.
combineArticles(fetchMashableArticles(), fetchRedditArticles(), fetchDiggArticles())


//loader function
function renderLoader() {
  return `
  <div ID="pacManLoader">
  <img src="./images/ajax_loader.gif" alt="Loading Icon" width="30" height="30"/>
  </div>
  `
}

//Render the articles into the 'render' function
function renderArticles(articles) {
  return articles.map(article => `
    <article class="article">
      <section class="featuredImage">
        <img src="${article.image}" alt="" />
      </section>
      <section class="articleContent">
          <a href="#"><h3>${article.title}</h3></a>
          <h6>${article.theme}</h6>
      </section>
      <section class="impressions">
        ${article.impressions}
      </section>
      <div class="clearfix"></div>
    </article>
  `).join('\n')
}

function renderPopUp() {
  return `
  <div id="popUp" class="${state.popupClass}">
    <a href="#" class="closePopUp">X</a>
    <div class="container">
      <h1>${state.popup.title}</h1>
      <p>
        ${state.popup.summary}
      </p>
      <a href="${state.popup.link}" class="popUpAction" target="_blank">Read more from source</a>
    </div>
  </div>
  `
}


//render articles from render function into HTML
function render(container, data) {
  container.innerHTML = `
  <header>
    <section class="container">
      <a href="#"><h1>Feedr</h1></a>
      <nav>
        <ul>
          <li><a href="#">News Source: <span>Source Name</span></a>
            <ul>
                <li><a ID='mashLink' href="#">Mashables</a></li>
                <li><a ID='redditLink' href="#">Reddit</a></li>
                <li><a ID='diggLink' href="#">Digg</a></li>
            </ul>
          </li>
        </ul>
        <section id="search" class=${data.searchClass}>
          <input type="text" name="name" value="" placeholder="Filter Articles...">
          <a href="#" id="searchPic"><img src="images/search.png" alt="" /></a>
        </section>
      </nav>
      <div class="clearfix"></div>
    </section>
  </header>
  ${renderPopUp()}
  <section id="main" class="container">
    ${data.loading ? renderLoader() : renderArticles(data.articles)}
  </section>
  `
}
//Render on startup
render(app, state)

//Feeding Articles from Mashables triggered each time the page
//hits the bottom of the article div.
//Reddit articles
export default function continuousMashArticles(page) {
  return fetchUrl(`http://mashable.com/stories.json?page=${page}`)
  .then(res => res.json())
  .then(data => {
    //console.log(data)
    return data.new.map(article => {
      return {
        image: article.feature_image,
        title: article.display_title,
        theme: article.channel,
        impressions: article.formatted_shares,
        summary: article.excerpt,
        link: article.short_url,
      }
    })
  })
}

//As you scroll down the page, pull more articles from reddit and
//Add them to the array at the bottom of the lastChild
export function yHandler() {
    let myContent = document.querySelectorAll("section#main.container")
    let selectContent = myContent[0]
    let contentHeight = selectContent.offsetHeight
    let yOffset = window.pageYOffset
    let y = yOffset + window.innerHeight
    if (y >= contentHeight) {
      let pageNumber = state.pagesFetched + 1
      state.pagesFetched = pageNumber

      continuousMashArticles(pageNumber)
      .then(articles => {
        state.articles = state.articles.concat(articles)
      })
      render(app, state)
    }
}
window.onscroll = yHandler

//on click of the search button, make the searchbar active.
  delegate('body', 'click', '#searchPic', event => {
    state.searchClass ? (state.searchClass = "") : (state.searchClass = "active")
    document.querySelector("input").focus()
    render(app, state);
  })

// Filter feed by title according to user keyboard input on the search input box.
// This should run the filter on every keystroke.
// When the input box is cleared, all articles should display in the respective feed.

delegate('body', 'keyup', 'input', event => {

  let searchText = document.querySelector('input').value.toLowerCase()
  let contentSection = document.querySelectorAll('.article')

  for (let i = 0; i < contentSection.length; i++) {
      if (contentSection[i].innerText.toLowerCase().includes(searchText) === true) {
          contentSection[i].style.display = ""
      } else {contentSection[i].style.display = "none"}
    }
})

//Onclick, find the article that was clicked.
//Update the state with the Article information
//update renderPopUp with the selected article info
//remove the popup class
//Open the article into the popUp

  delegate('body', 'click', '.articleContent', event => {

  let element = event.target
  let elementTitle = element.innerText

  const index = state.articles.findIndex(item => {
    return elementTitle === item.title
  })
      state.popup = state.articles[index]
      state.popupClass = ""
      render(app,state)
  })

//on click, close the popup box
  delegate('body', 'click', '.closePopUp', event => {
    state.popupClass = 'loader hidden'
    render(app,state)
  })

//on a click on the 'feedr' icon, combine the articles as per 'home' screen
  delegate('body', 'click', 'h1', event => {
    combineArticles(fetchMashableArticles(), fetchRedditArticles(), fetchDiggArticles())
  })

//Select the individual feeds from the dropdown list.
const delegateFunction = (source) => {
  state.loading = true;
  render(app, state);

  state.source = source;

  fetchArticles(state.source)
  .then(articles => state.articles = articles)
  .then(() => {
        state.loading = false;
        render(app, state)
      })

  .catch(err => {
    state.articles.title = 'something went wrong'
    console.log(err)
    state.loading = false;
    render(app, state)
  })
}

//On click, initiate Mashables feed
 delegate('body', 'click', '#mashLink', event => {
   delegateFunction('mashable')
  })

//On click, initiate Digg Feed
  delegate('body', 'click', '#diggLink', event => {
      delegateFunction('digg')
      //console.log(fetchDiggArticles())
    })

  //On click, initiate Reddit Feed
    delegate('body', 'click', '#redditLink', event => {
        delegateFunction('reddit')
        //console.log(fetchRedditArticles())
      })

//Original code looks like this;
//We reduced it to make it DRY as per the attached by adding in the delegate function.
/*
      delegate('body', 'click', '#mashLink', event => {
        state.loading = true;
        render(app, state);

        state.source = 'mashable';

        fetchArticles(state.source)
        .then(articles => state.articles = articles)
        .then(() => {
              state.loading = false;
              render(app, state)
            })

        .catch(err => {
          state.articles.title = 'something went wrong'
          console.log(err)
          state.loading = false;
          render(app, state)
        })
      }
//Fetching multiple pages eg pages 1 - 1000 using all promises and reduce.

function continuousRedditArticles(pages) {
  const promises = new Array(pages)
  .fill('')
  .map((_, index) => fetchUrl(`https://www.reddit.com/top.json?page=${index}`)
  .then(res => res.json()))

  return Promise.all(promises)
  .then(results => results.map(result => {
    return result.data.children.map(article => {
     return {
           image: article.data.thumbnail,
           title: article.data.title,
           theme: article.data.domain,
           impressions: article.data.num_comments,
           summary: article.data.title,
           link: article.data.url
         }
   })
 }))
 .then(results => results.reduce((flatArray, nextArr) => flatArray.concat(nextArr), []))
}


*/
