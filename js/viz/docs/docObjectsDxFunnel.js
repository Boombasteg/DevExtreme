
/**
* @name dxfunnelItem
* @publicName Item
*/
var Item = {
    /**
    * @name dxfunnelItemfields_data
    * @publicName data
    * @type object
    */
    data: undefined,
    /**
    * @name dxfunnelItemfields_id
    * @publicName id
    * @type number
    */
    id: undefined,
    /**
    * @name dxfunnelItemfields_percent
    * @publicName percent
    * @type number
    */
    percent: undefined,
    /**
    * @name dxfunnelItemmethods_select
    * @publicName select(state)
    * @param1 state:boolean
    */
    select: function () { },
    /**
    * @name dxfunnelItemmethods_hover
    * @publicName hover(state)
    * @param1 state:boolean
    */
    hover: function () { },
    /**
    * @name dxfunnelItemmethods_getcolor
    * @publicName getColor()
    * @return string
    */
    getColor: function () { },
    /**
    * @name dxfunnelItemmethods_ishovered
    * @publicName isHovered()
    * @return boolean
    */
    isHovered: function () { },
    /**
    * @name dxfunnelItemmethods_isselected
    * @publicName isSelected()
    * @return boolean
    */
    isSelected: function () { },

    /**
    * @name dxfunnelItemmethods_showtooltip
    * @publicName showTooltip()
    */
    showTooltip: function(){ }
};
