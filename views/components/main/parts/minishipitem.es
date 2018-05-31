import { join } from 'path-extra'
import classNames from 'classnames'
import { connect } from 'react-redux'
import shallowEqual from 'fbjs/lib/shallowEqual'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createSelector } from 'reselect'
import { ProgressBar, OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { isEqual, pick, omit, memoize, get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { translate } from 'react-i18next'

import defaultLayout from '../default-layout'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import { LandbaseSlotitems } from 'views/components/ship/slotitems'
import { SlotitemIcon } from 'views/components/etc/icon'
import { Avatar } from 'views/components/etc/avatar'
import { getCondStyle, equipIsAircraft, getShipLabelStatus, getHpStyle, getStatusStyle, getTyku } from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  configLayoutSelector,
  configReverseLayoutSelector,
  escapeStatusSelectorFactory,
  landbaseSelectorFactory,
  landbaseEquipDataSelectorFactory,
} from 'views/utils/selectors'

// From plugin-exp-calculator/constants.es
const levelToExp = {
  1: 0,
  2: 100,
  3: 300,
  4: 600,
  5: 1000,
  6: 1500,
  7: 2100,
  8: 2800,
  9: 3600,
  10: 4500,
  11: 5500,
  12: 6600,
  13: 7800,
  14: 9100,
  15: 10500,
  16: 12000,
  17: 13600,
  18: 15300,
  19: 17100,
  20: 19000,
  21: 21000,
  22: 23100,
  23: 25300,
  24: 27600,
  25: 30000,
  26: 32500,
  27: 35100,
  28: 37800,
  29: 40600,
  30: 43500,
  31: 46500,
  32: 49600,
  33: 52800,
  34: 56100,
  35: 59500,
  36: 63000,
  37: 66600,
  38: 70300,
  39: 74100,
  40: 78000,
  41: 82000,
  42: 86100,
  43: 90300,
  44: 94600,
  45: 99000,
  46: 103500,
  47: 108100,
  48: 112800,
  49: 117600,
  50: 122500,
  51: 127500,
  52: 132700,
  53: 138100,
  54: 143700,
  55: 149500,
  56: 155500,
  57: 161700,
  58: 168100,
  59: 174700,
  60: 181500,
  61: 188500,
  62: 195800,
  63: 203400,
  64: 211300,
  65: 219500,
  66: 228000,
  67: 236800,
  68: 245900,
  69: 255300,
  70: 265000,
  71: 275000,
  72: 285400,
  73: 296200,
  74: 307400,
  75: 319000,
  76: 331000,
  77: 343400,
  78: 356200,
  79: 369400,
  80: 383000,
  81: 397000,
  82: 411500,
  83: 426500,
  84: 442000,
  85: 458000,
  86: 474500,
  87: 491500,
  88: 509000,
  89: 527000,
  90: 545500,
  91: 564500,
  92: 584500,
  93: 606500,
  94: 631500,
  95: 661500,
  96: 701500,
  97: 761500,
  98: 851500,
  99: 1000000,
  100: 1000000,
  101: 1010000,
  102: 1011000,
  103: 1013000,
  104: 1016000,
  105: 1020000,
  106: 1025000,
  107: 1031000,
  108: 1038000,
  109: 1046000,
  110: 1055000,
  111: 1065000,
  112: 1077000,
  113: 1091000,
  114: 1107000,
  115: 1125000,
  116: 1145000,
  117: 1168000,
  118: 1194000,
  119: 1223000,
  120: 1255000,
  121: 1290000,
  122: 1329000,
  123: 1372000,
  124: 1419000,
  125: 1470000,
  126: 1525000,
  127: 1584000,
  128: 1647000,
  129: 1714000,
  130: 1785000,
  131: 1860000,
  132: 1940000,
  133: 2025000,
  134: 2115000,
  135: 2210000,
  136: 2310000,
  137: 2415000,
  138: 2525000,
  139: 2640000,
  140: 2760000,
  141: 2887000,
  142: 3021000,
  143: 3162000,
  144: 3310000,
  145: 3465000,
  146: 3628000,
  147: 3799000,
  148: 3978000,
  149: 4165000,
  150: 4360000,
  151: 4564000,
  152: 4777000,
  153: 4999000,
  154: 5230000,
  155: 5470000,
  156: 5720000,
  157: 5780000,
  158: 5860000,
  159: 5970000,
  160: 6120000,
  161: 6320000,
  162: 6580000,
  163: 6910000,
  164: 7320000,
  165: 7820000,
}

const slotitemsDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([ship, $ship]=[], equipsData) => ({
    api_maxeq: ($ship || {}).api_maxeq,
    equipsData,
  }))
)

const Slotitems = translate(['resources'])(connect(
  (state, {shipId}) =>
    slotitemsDataSelectorFactory(shipId)(state),
)(function ({api_maxeq, equipsData, t}) {
  const tooltipClassName = classNames("item-name", {
    "hidden": !equipsData,
  })
  return (
    <div className={tooltipClassName}>
      <div className="slotitems-mini" style={{display: "flex", flexFlow: "column"}}>
        {
          equipsData.filter(Boolean).map((equipData, equipIdx) => {
            const [equip, $equip, onslot] = equipData
            const equipIconId = $equip.api_type[3]
            const level = equip.api_level
            const proficiency = equip.api_alv
            const isAircraft = equipIsAircraft($equip)
            const maxOnslot = (api_maxeq || [])[equipIdx]
            const onslotText = onslot
            const onslotWarning = maxOnslot && onslot < maxOnslot
            const onslotClassName = classNames("slotitem-onslot", {
              'show': isAircraft,
              'hide': !isAircraft,
            })
            return (
              <div key={equipIdx} className="slotitem-container-mini">
                <SlotitemIcon key={equip.api_id} className='slotitem-img' slotitemId={equipIconId} />
                <span style={{ flex: 1, textAlign: 'left' }}>{$equip ? t(`resources:${$equip.api_name}`, {keySeparator: '%%%%'}) : '???'}</span>
                {
                  Boolean(level) &&
                  <strong style={{color: '#45A9A5'}}> <FontAwesome name='star' />{level}</strong>
                }
                <span style={{ width: '1ex', display: 'inline-block' }} />
                {
                  proficiency &&
                  <img className='alv-img' src={join('assets', 'img', 'airplane', `alv${proficiency}.png`)} />
                }
                <Label
                  className={onslotClassName}
                  bsStyle={`${onslotWarning ? 'warning' : 'default'}`}
                  style={{ width: '3em' }}
                >
                  {onslotText}
                </Label>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}))

const miniShipRowDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipRepairDockSelectorFactory(shipId),
    escapeStatusSelectorFactory(shipId),
    configLayoutSelector,
    configReverseLayoutSelector,
    state => get(state, 'layout.mainpane.width', 450),
    state => get(state, 'config.poi.mainpanel.layout', defaultLayout),
  ], ([ship, $ship]=[], repairDock, escaped, layout, reversed, mainPanelWidth, mainPanelLayout ) => {
    const miniShipPanelLayout = mainPanelLayout[mainPanelWidth > 750 ? 'lg' : 'sm']
      .find(panel => panel.i === 'miniship')
    const colCnt = mainPanelWidth > 750 ? 20 : 10
    const colWidth = mainPanelWidth / colCnt
    const rightDist = (colCnt - miniShipPanelLayout.x - miniShipPanelLayout.w) * colWidth
    return {
      ship: ship || {},
      $ship: $ship || {},
      labelStatus: getShipLabelStatus(ship, $ship, repairDock, escaped),
      tooltipPos: (layout === 'horizontal' && reversed) || rightDist >= 180 ? 'right' : 'left',
    }
  })
)

@translate(['resources', 'main'])
@connect((state, {shipId}) => miniShipRowDataSelectorFactory(shipId))
export class MiniShipRow extends Component {
  static propTypes = {
    ship: PropTypes.object,
    $ship: PropTypes.object,
    labelStatus: PropTypes.number,
    tooltipPos: PropTypes.string,
    enableAvatar: PropTypes.bool,
    compact: PropTypes.bool,
  }

  shouldComponentUpdate(nextProps) {
    // Remember to expand the list in case you add new properties to display
    const shipPickProps = ['api_lv', 'api_exp', 'api_id', 'api_nowhp', 'api_maxhp', 'api_cond', 'api_slot', 'api_slot_ex']
    return !shallowEqual(omit(this.props, ['ship']), omit(nextProps, ['ship'])) ||
      !isEqual(pick(this.props.ship, shipPickProps), pick(nextProps.ship, shipPickProps))
  }

  render() {
    const { ship, $ship, labelStatus, tooltipPos, enableAvatar, compact, t } = this.props
    const hideShipName = enableAvatar && compact
    if (!ship)
      return <div></div>
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = ship.api_nowhp / ship.api_maxhp * 100
    const shipInfoClass = classNames("ship-info", {
      "ship-avatar-padding": enableAvatar,
      "ship-info-hidden": hideShipName,
      "ship-info-show": !hideShipName,
    })
    const level = ship.api_lv
    const nextLevel = $ship.api_afterlv
    const exp = (ship.api_exp || [])[0]
    const nextExp = (ship.api_exp || [])[1]
    const maxExpString = level < 99 ? `99: ${(levelToExp[99] - exp) || '??'}` : level < 165 ? `165: ${(levelToExp[165] - exp) || '??'}` : null
    const remodelExpString = level < nextLevel ? `Remodel: ${nextLevel}, ${(levelToExp[nextLevel] - exp) || '??'}` : nextLevel ? `Remodel: ${nextLevel}` : null
    return (
      <div className="ship-tile">
        <OverlayTrigger
          placement={tooltipPos}
          overlay={
            (( ship.api_slot && ship.api_slot[0] !== -1) || ship.api_slot_ex > 0) ?
              <Tooltip id={`ship-pop-${ship.api_id}`} className='ship-pop'>
                <Slotitems shipId={ship.api_id} />
              </Tooltip>
              : <Tooltip id={`ship-pop-${ship.api_id}`} style={{display: 'none'}}></Tooltip>
          }
        >
          <div className="ship-item">
            { enableAvatar && (
              <Avatar mstId={$ship.api_id} isDamaged={hpPercentage <= 50} height={33}>
                {compact ? <div className='ship-lv-avatar'>Lv. {level || '??'}</div> : null}
              </Avatar>
            ) }
            <OverlayTrigger placement='top' overlay={
              <Tooltip id={`miniship-exp-${ship.api_id}`}>
                {
                  hideShipName ? (
                    <div className="ship-tooltip-info">
                      <div>{$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}</div>
                      {exp > 0 ? <div>Total: {exp}</div> : null}
                      {nextExp > 0 ? <div>Next: {nextExp}</div> : null}
                      {remodelExpString ? <div>{remodelExpString}</div> : null}
                      {maxExpString ? <div>{maxExpString}</div> : null}
                    </div>
                  ) : <div>
                    {exp > 0 ? <div>Total: {exp}</div> : null}
                    {nextExp > 0 ? <div>Next: {nextExp}</div> : null}
                    {remodelExpString ? <div>{remodelExpString}</div> : null}
                    {maxExpString ? <div>{maxExpString}</div> : null}
                  </div>
                }
              </Tooltip>
            }>
              <div className={shipInfoClass}>
                {
                  !hideShipName && (
                    <>
                      <span className="ship-name" style={labelStatusStyle}>
                        {$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}
                      </span>
                      <span className="ship-lv-text top-space" style={labelStatusStyle}>
                        Lv. {level || '??'}
                      </span>
                    </>
                  )
                }
              </div>
            </OverlayTrigger>
            <div className="ship-stat">
              <div className="div-row">
                <span className="ship-hp" style={labelStatusStyle}>
                  {ship.api_nowhp} / {ship.api_maxhp}
                </span>
                <div className="status-label">
                  <StatusLabel label={labelStatus} />
                </div>
                <div className={"ship-cond " + getCondStyle(ship.api_cond)}>
                  <FontAwesome name='star' />{ship.api_cond}
                </div>
              </div>
              <span className="hp-progress top-space" style={labelStatusStyle}>
                <ProgressBar bsStyle={getHpStyle(hpPercentage)} now={hpPercentage} />
              </span>
            </div>
          </div>
        </OverlayTrigger>
      </div>
    )
  }
}

export const MiniSquardRow = translate(['main'])(connect((state, { squardId }) =>
  createSelector([
    landbaseSelectorFactory(squardId),
    landbaseEquipDataSelectorFactory(squardId),
  ], (landbase, equipsData) => ({
    landbase,
    equipsData,
    squardId,
  }))
)(({landbase, equipsData, squardId, t}) => {
  const { api_action_kind, api_name } = landbase
  const tyku = getTyku([equipsData], api_action_kind)
  const statuslabel = (() => {
    switch (api_action_kind) {
    // 0=待機, 1=出撃, 2=防空, 3=退避, 4=休息
    case 0:
      return <Label bsStyle='default'>{t('main:Standby')}</Label>
    case 1:
      return <Label bsStyle='danger'>{t('main:Sortie')}</Label>
    case 2:
      return <Label bsStyle='warning'>{t('main:Defense')}</Label>
    case 3:
      return <Label bsStyle='primary'>{t('main:Retreat')}</Label>
    case 4:
      return <Label bsStyle='success'>{t('main:Rest')}</Label>
    }
  })()
  return (
    <div className="ship-tile">
      <div className="ship-item">
        <div className="ship-info ship-info-show">
          <span className="ship-name">
            {api_name}
          </span>
          <span className="ship-lv-text top-space">
            <div className="ship-fp">
              {t('main:Fighter Power')}: {(tyku.max === tyku.min) ? tyku.min : tyku.min + '+'}
            </div>
            {statuslabel}
          </span>
        </div>
        <div className="ship-stat landbase-stat">
          <div className="div-row">
            <LandbaseSlotitems landbaseId={squardId} isMini={true} />
          </div>
        </div>
      </div>
    </div>
  )
}))
