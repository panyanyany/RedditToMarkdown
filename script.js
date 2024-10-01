const http = new XMLHttpRequest()
var data
var output = ''
var style = 0
var escapeNewLine = false
var spaceComment = false

function fetchData(url, prependText) {
  var ouput_display = document.getElementById("ouput-display");
  ouput_display.innerHTML = '';
  output = ''
  if (prependText) {
    output = prependText + '\n\n'
  }

  http.open("GET", `${url}.json`)
  http.responseType = 'json';
  http.send()

  http.onload = function() {
    data = http.response;
    const post = data[0].data.children[0].data
    const comments = data[1].data.children
    displayTitle(post)
    output += "\n\n## Comments\n\n"
    comments.forEach(displayComment);

    console.log("Done")
    var ouput_block = document.getElementById("ouput-block");
    ouput_block.classList.remove("d-none");
    ouput_display.innerHTML = escapeHtml(output);
    download(output, 'output.md', 'text/plain')
  }
}

function setStyle() {
  if (document.getElementById("treeOption").checked) {
    style = 0
  } else {
    style = 1
  }

  if (document.getElementById("escapeNewLine").checked) {
    escapeNewLine = true
  } else {
    escapeNewLine = false
  }

  if (document.getElementById("spaceComment").checked) {
    spaceComment = true
  } else {
    spaceComment = false
  }
}

function startExport() {
  console.log("Start exporting")
  setStyle()

  var url = document.getElementById('url').value
  if (url) {
    var prependText = document.getElementById('prependText').value
    var prependEnabled = document.getElementById('prependEnabled').checked
    fetchData(url, prependEnabled ? prependText : '')
  } else {
    console.log("No url provided")
  }
}

function download(text, name, type) {
  var a = document.getElementById("a");
  a.removeAttribute("disabled");
  var file = new Blob([text], {type: type});
  a.href = URL.createObjectURL(file);
  a.download = name;
}

function displayTitle(post) {
  const created = new Date(post.created_utc * 1000)
  const date = created.toISOString().split('T')[0]
  output += `# ${post.title}\n`
  // Check if the post has an image
  if (post.url && post.url.match(/\.(jpeg|jpg|gif|png)$/)) {
    output += `\n![](${post.url})\n`
  }
  // Check if the post has a video or gallery
  if (post.is_video) {
    output += `\n<video src="${post.media.reddit_video.fallback_url}" controls></video>\n`
  } else if (post.is_gallery) {
    post.gallery_data.items.forEach(item => {
      const mediaId = item.media_id
      const mediaUrl = post.media_metadata[mediaId].s.u
      output += `\n![](${mediaUrl})\n`
    })
  }
  if (post.selftext) {
    output += `\n${post.selftext}\n`
  }
  output += `\n[permalink](https://reddit.com${post.permalink})`
  output += `\nby *${post.author}* (↑ ${post.ups}/ ↓ ${post.downs}) published on ${date}\n\n`
}

function formatComment(text) {
  if (escapeNewLine) {
    return text.replace(/(\r\n|\n|\r)/gm, "");
  } else {
    return text
  }
}

function displayComment(comment, index) {

  if (style == 0 ) {
      depthTag = '─'.repeat(comment.data.depth)
      if (depthTag != '') {
        output += `├${depthTag} `
      } else {
        output += `##### `
      }
  } else {
      depthTag = '\t'.repeat(comment.data.depth)
      if (depthTag != '') {
        output += `${depthTag}- `
      } else {
        output += `- `
      }
  }

  if (comment.data.body) {
    console.log(formatComment(comment.data.body))
    output += `${formatComment(comment.data.body)} ⏤ by *${comment.data.author}* (↑ ${comment.data.ups}/ ↓ ${comment.data.downs})\n`
  } else {
    output += 'deleted \n'
  }

  if (comment.data.replies) {
    const subComment = comment.data.replies.data.children
    subComment.forEach(displayComment)
  }

  if (comment.data.depth == 0 && comment.data.replies) {
    if (style == 0 ) {
      output += '└────\n\n'
    } 
    if (spaceComment) {
      output += '\n'
    }
  }
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
