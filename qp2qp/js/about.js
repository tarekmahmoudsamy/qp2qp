function About()
{
    this.init();
}

About.prototype =
{
    container: null,

    init: function()
    {
        var text, containerText;

        this.container = document.createElement("div");
        this.container.className = 'gui about';
        this.container.style.position = 'absolute';
        this.container.style.top = '0px';
        this.container.style.visibility = 'hidden';

      /*  containerText = document.createElement("div");
        containerText.style.margin = '10px 10px';
        containerText.style.textAlign = 'left';
        this.container.appendChild(containerText);

        text = document.createElement("p");
        text.style.textAlign = 'center';
        text.innerHTML = '<strong>qp2qp</strong>';
        containerText.appendChild(text);

        text = document.createElement("p");
        text.style.textAlign = 'center';
        text.innerHTML = '<strong>modified version of HARMONY by Mr.doob</strong> ';
        containerText.appendChild(text);

        text = document.createElement("p");
        text.style.textAlign = 'center';
        text.innerHTML = 'use two fingers to hold the pen and draw';
        containerText.appendChild(text);

        text = document.createElement("p");
        text.style.textAlign = 'center';
        text.innerHTML = 'Tap <span class="key">three fingers</span> to open the foreground color picker.';
        containerText.appendChild(text);

        text = document.createElement("p");
        text.style.textAlign = 'center';
        text.innerHTML = 'Tap <span class="key">four fingers</span> to reset the brush.';
        containerText.appendChild(text);
*/
       
    },

    show: function()
    {
        this.container.style.visibility = 'visible';
    },

    hide: function()
    {
        this.container.style.visibility = 'hidden';
    }
}
